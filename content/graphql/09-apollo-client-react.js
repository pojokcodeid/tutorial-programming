/* ============================================================
   GraphQL — Bab 9: Integrasi Apollo Client dengan React
   ============================================================ */
'use strict';
window.GRAPHQL_LESSONS = window.GRAPHQL_LESSONS || [];
window.GRAPHQL_LESSONS.push({
  id: 'apollo-client-react',
  title: 'Integrasi Apollo Client dengan React',
  chapter: 'Frontend Integration',
  duration: '20 menit',
  intro: [
    'Setelah server GraphQL siap, saatnya menghubungkan frontend React. <b>Apollo Client</b> adalah library paling populer untuk itu — ia menangani pengiriman query, caching otomatis, dan state management data server dalam satu paket.',
    'Dalam pelajaran ini kita akan setup Apollo Client dari nol di project React (Vite), membungkus app dengan <code>ApolloProvider</code>, lalu mengambil dan memanipulasi data GraphQL menggunakan hook <code>useQuery</code> dan <code>useMutation</code>.'
  ],
  objectives: [
    'Membuat project React dengan Vite dan menginstall @apollo/client',
    'Mengkonfigurasi ApolloClient dengan InMemoryCache dan HttpLink',
    'Membungkus aplikasi dengan ApolloProvider di file main.tsx',
    'Menggunakan useQuery untuk mengambil data dari server GraphQL',
    'Menggunakan useMutation untuk mengirim mutation dan meng-update tampilan',
    'Memahami refetchQueries agar daftar data otomatis terupdate setelah mutation'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Apa itu Apollo Client?</h3><p>Apollo Client adalah library JavaScript yang memungkinkan React berkomunikasi dengan server GraphQL. Kemampuannya meliputi:</p><table><thead><tr><th>Fitur</th><th>Penjelasan</th></tr></thead><tbody><tr><td><b>Pengiriman Query/Mutation</b></td><td>Kirim request ke endpoint GraphQL secara otomatis</td></tr><tr><td><b>InMemoryCache</b></td><td>Cache hasil query agar tidak double-fetch data yang sama</td></tr><tr><td><b>Reactive UI</b></td><td>Komponen React otomatis re-render saat data berubah</td></tr><tr><td><b>Loading &amp; Error State</b></td><td>Properti <code>loading</code> dan <code>error</code> siap pakai tanpa useState manual</td></tr></tbody></table><p>Kamu tidak perlu menulis <code>fetch()</code> atau <code>axios</code> secara manual — Apollo mengurus semuanya.</p>'
    },
    {
      type: 'example',
      title: 'Langkah 1: Buat project React + install Apollo Client',
      lang: 'bash',
      output: false,
      code: `# Buat project baru dengan Vite + React + TypeScript
npm create vite@latest my-graphql-app -- --template react-ts
cd my-graphql-app

# Install Apollo Client dan GraphQL
npm install @apollo/client graphql

# Jalankan dev server
npm run dev`,
      explain: [
        'Perintah <code>npm create vite@latest</code> membuat project React dengan TypeScript siap pakai.',
        'Package <code>@apollo/client</code> berisi semua yang kita butuhkan: ApolloClient, hooks, cache, dan lebih banyak lagi.',
        'Package <code>graphql</code> adalah dependensi peer — dibutuhkan oleh Apollo untuk mem-parse dokumen GraphQL.',
        'Setelah install, struktur folder yang kita fokuskan: <code>src/lib/apollo.ts</code> (konfigurasi client) dan <code>src/main.tsx</code> (provider).'
      ]
    },
    {
      type: 'example',
      title: 'Langkah 2: Konfigurasi Apollo Client (src/lib/apollo.ts)',
      lang: 'typescript',
      output: false,
      code: `// src/lib/apollo.ts
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

// HttpLink: menunjuk ke endpoint GraphQL server kita
const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql',
});

// InMemoryCache: menyimpan hasil query di memori browser
const cache = new InMemoryCache();

// ApolloClient: gabungkan link dan cache menjadi satu client
export const client = new ApolloClient({
  link: httpLink,
  cache,
  // Aktifkan DevTools di browser (hanya untuk development)
  connectToDevTools: true,
});`,
      explain: [
        '<code>HttpLink</code> bertanggung jawab mengirim request HTTP POST ke URL GraphQL yang kita tentukan.',
        '<code>InMemoryCache</code> menyimpan hasil query di memori. Jika query yang sama dijalankan lagi, Apollo mengambil dari cache bukan dari server.',
        'Properti <code>connectToDevTools: true</code> mengaktifkan Apollo DevTools extension di browser untuk inspeksi cache secara visual.',
        'File ini hanya mengekspor <code>client</code> — kita akan menyambungkannya ke React di <code>main.tsx</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Langkah 3: Bungkus App dengan ApolloProvider (src/main.tsx)',
      lang: 'typescript',
      output: false,
      code: `// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ApolloProvider } from '@apollo/client';
import { client } from './lib/apollo';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* ApolloProvider harus membungkus seluruh app agar semua komponen
        dapat mengakses Apollo Client melalui hooks */}
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </React.StrictMode>
);`,
      explain: [
        '<code>ApolloProvider</code> menggunakan React Context di balik layar — ia "menyuntikkan" client ke seluruh pohon komponen.',
        'Karena itu, <code>ApolloProvider</code> harus berada di paling luar (root), membungkus seluruh aplikasi.',
        'Setelah ini, komponen mana pun di dalam <code>App</code> bisa langsung menggunakan <code>useQuery</code> atau <code>useMutation</code> tanpa perlu prop drilling.',
        'Kita memasukkan <code>client</code> yang sudah dikonfigurasi di <code>src/lib/apollo.ts</code> via prop <code>client</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Mendefinisikan Query dengan gql template literal',
      lang: 'typescript',
      output: false,
      code: `// src/queries/userQueries.ts
import { gql } from '@apollo/client';

// Query untuk mengambil semua user
export const GET_USERS = gql\`
  query GetUsers {
    users {
      id
      name
      email
      createdAt
    }
  }
\`;

// Mutation untuk membuat user baru
export const CREATE_USER = gql\`
  mutation CreateUser($name: String!, $email: String!) {
    createUser(name: $name, email: $email) {
      id
      name
      email
      createdAt
    }
  }
\`;`,
      explain: [
        'Tag <code>gql</code> mengubah string template menjadi dokumen GraphQL yang dapat diparsing oleh Apollo.',
        'Konvensi: nama operasi ditulis PascalCase (mis. <code>GetUsers</code>, <code>CreateUser</code>) agar mudah dilacak di DevTools.',
        'Mendefinisikan query di file terpisah memudahkan reuse di banyak komponen berbeda.',
        'Variabel mutation (<code>$name</code>, <code>$email</code>) didefinisikan di tanda kurung setelah nama operasi dengan tipe datanya.'
      ]
    },
    {
      type: 'example',
      title: 'Komponen UserList.tsx — menggunakan useQuery',
      lang: 'typescript',
      output: false,
      code: `// src/components/UserList.tsx
import { useQuery } from '@apollo/client';
import { GET_USERS } from '../queries/userQueries';

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface GetUsersData {
  users: User[];
}

export function UserList() {
  // useQuery mengirim GET_USERS ke server secara otomatis saat komponen dimount
  const { data, loading, error } = useQuery<GetUsersData>(GET_USERS);

  // State loading: tampilkan indikator
  if (loading) return <p>Memuat data users...</p>;

  // State error: tampilkan pesan error
  if (error) return <p style={{ color: 'red' }}>Error: {error.message}</p>;

  // State sukses: render daftar user
  return (
    <div>
      <h2>Daftar User ({data?.users.length})</h2>
      <ul>
        {data?.users.map((user) => (
          <li key={user.id}>
            <strong>{user.name}</strong> — {user.email}
          </li>
        ))}
      </ul>
    </div>
  );
}`,
      explain: [
        '<code>useQuery</code> mengembalikan objek dengan tiga properti paling penting: <code>data</code>, <code>loading</code>, dan <code>error</code>.',
        'Saat komponen pertama dimount, Apollo secara otomatis mengirim query ke server. Selama menunggu, <code>loading</code> bernilai <code>true</code>.',
        'Jika request gagal (network error, server error, dll), Apollo mengisi properti <code>error</code>.',
        'Hasil query disimpan di cache — jika komponen lain juga butuh data yang sama, Apollo mengambil dari cache tanpa request ulang.',
        'TypeScript generic <code>useQuery&lt;GetUsersData&gt;</code> memberikan type-safety penuh pada properti <code>data</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Komponen CreateUserForm.tsx — menggunakan useMutation + refetchQueries',
      lang: 'typescript',
      output: false,
      code: `// src/components/CreateUserForm.tsx
import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_USER, GET_USERS } from '../queries/userQueries';

export function CreateUserForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // useMutation mengembalikan fungsi createUser yang kita panggil secara manual
  const [createUser, { loading, error }] = useMutation(CREATE_USER, {
    // refetchQueries: setelah mutation berhasil, jalankan ulang query ini
    // sehingga daftar user di UserList otomatis terupdate
    refetchQueries: [{ query: GET_USERS }],
    onCompleted: () => {
      // Reset form setelah berhasil
      setName('');
      setEmail('');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createUser({
      variables: { name, email },
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Tambah User Baru</h2>
      <input
        type="text"
        placeholder="Nama"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Menyimpan...' : 'Tambah User'}
      </button>
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
    </form>
  );
}`,
      explain: [
        '<code>useMutation</code> mengembalikan array: elemen pertama adalah fungsi untuk menjalankan mutation, elemen kedua berisi state (loading, error, data).',
        'Berbeda dengan <code>useQuery</code>, mutation TIDAK dijalankan otomatis — kita memanggil fungsi <code>createUser</code> secara manual saat form disubmit.',
        'Variabel dikirim via properti <code>variables</code> saat memanggil fungsi mutation.',
        '<code>refetchQueries</code> adalah cara paling mudah memperbarui data setelah mutation: Apollo akan mengirim ulang query <code>GET_USERS</code> ke server secara otomatis.',
        'Callback <code>onCompleted</code> berjalan setelah mutation sukses — cocok untuk reset form atau menampilkan notifikasi sukses.'
      ]
    },
    {
      type: 'live',
      title: 'Coba Sendiri: Simulasi Apollo Client — Fetch & Tambah User',
      lang: 'html',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: system-ui, sans-serif; font-size: 14px; margin: 16px; color: #0f172a; background: #f8fafc; }
  h3 { margin: 0 0 8px; font-size: 15px; color: #1e293b; }
  .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 16px; }
  .provider-badge { display: inline-block; background: #dbeafe; color: #1e40af; border-radius: 99px; padding: 2px 10px; font-size: 12px; font-weight: 700; margin-bottom: 12px; }
  button { padding: 8px 16px; background: #2563eb; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; }
  button:hover { background: #1d4ed8; }
  button:disabled { background: #94a3b8; cursor: not-allowed; }
  input { padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 6px; margin-right: 8px; font-size: 13px; width: 140px; }
  .user-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
  .avatar { width: 32px; height: 32px; border-radius: 50%; background: #2563eb; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0; }
  .user-info { flex: 1; }
  .user-name { font-weight: 600; font-size: 14px; }
  .user-email { font-size: 12px; color: #64748b; }
  .log { background: #0f172a; color: #94a3b8; border-radius: 8px; padding: 12px; font-size: 12px; font-family: monospace; height: 90px; overflow-y: auto; margin-top: 8px; }
  .log-ok { color: #4ade80; }
  .log-info { color: #60a5fa; }
  .log-cache { color: #f59e0b; }
  .tag-loading { color: #f59e0b; font-style: italic; }
  #userCount { color: #64748b; font-size: 12px; margin-left: 8px; }
</style>
</head>
<body>
<div class="provider-badge">🔌 ApolloProvider aktif</div>

<div class="card">
  <h3>👥 UserList — useQuery(GET_USERS)</h3>
  <button id="btnLoad">Load Users</button>
  <span id="userCount"></span>
  <div id="userList" style="margin-top:12px;min-height:40px;"></div>
</div>

<div class="card">
  <h3>➕ CreateUserForm — useMutation(CREATE_USER)</h3>
  <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
    <input id="inputName" type="text" placeholder="Nama" />
    <input id="inputEmail" type="email" placeholder="Email" />
    <button id="btnAdd">Tambah User</button>
  </div>
  <div id="mutationStatus" style="margin-top:8px;font-size:12px;color:#64748b;"></div>
</div>

<div class="card">
  <h3>📋 Apollo Network Log</h3>
  <div class="log" id="logBox"></div>
</div>

<script>
  var mockUsers = [
    { id: '1', name: 'Budi Santoso', email: 'budi@mail.com' },
    { id: '2', name: 'Ani Rahayu', email: 'ani@mail.com' },
    { id: '3', name: 'Dewi Putri', email: 'dewi@mail.com' },
  ];
  var nextId = 4;
  var isCached = false;

  function log(msg, cls) {
    var box = document.getElementById('logBox');
    var line = document.createElement('div');
    line.innerHTML = '<span style="color:#475569">[' + new Date().toLocaleTimeString() + ']</span> ' + '<span class="' + (cls || '') + '">' + msg + '</span>';
    box.appendChild(line);
    box.scrollTop = box.scrollHeight;
  }

  function renderUsers(users) {
    var list = document.getElementById('userList');
    if (users.length === 0) {
      list.innerHTML = '<p style="color:#94a3b8;font-size:13px;">Belum ada user.</p>';
    } else {
      list.innerHTML = users.map(function(u) {
        return '<div class="user-item"><div class="avatar">' + u.name[0].toUpperCase() + '</div><div class="user-info"><div class="user-name">' + u.name + '</div><div class="user-email">' + u.email + '</div></div></div>';
      }).join('');
    }
    document.getElementById('userCount').textContent = '(' + users.length + ' user)';
  }

  document.getElementById('btnLoad').onclick = function() {
    var btn = this;
    btn.disabled = true;
    btn.textContent = 'Loading...';
    document.getElementById('userList').innerHTML = '<p class="tag-loading">⏳ Fetching data...</p>';

    if (isCached) {
      log('→ GET_USERS: ditemukan di cache, tidak fetch ulang', 'log-cache');
      setTimeout(function() {
        renderUsers(mockUsers);
        btn.disabled = false;
        btn.textContent = 'Load Users';
      }, 200);
      return;
    }

    log('→ Mengirim query GET_USERS ke /graphql...', 'log-info');
    setTimeout(function() {
      log('← Response 200 OK: ' + mockUsers.length + ' users diterima', 'log-ok');
      log('← Data disimpan ke InMemoryCache', 'log-cache');
      isCached = true;
      renderUsers(mockUsers);
      btn.disabled = false;
      btn.textContent = 'Load Users';
    }, 900);
  };

  document.getElementById('btnAdd').onclick = function() {
    var name = document.getElementById('inputName').value.trim();
    var email = document.getElementById('inputEmail').value.trim();
    if (!name || !email) {
      document.getElementById('mutationStatus').textContent = '⚠️ Nama dan email harus diisi!';
      return;
    }
    var btn = this;
    btn.disabled = true;
    document.getElementById('mutationStatus').textContent = '⏳ Menjalankan mutation...';
    log('→ Mengirim mutation CREATE_USER { name: "' + name + '", email: "' + email + '" }', 'log-info');

    setTimeout(function() {
      var newUser = { id: String(nextId++), name: name, email: email };
      mockUsers.push(newUser);
      isCached = false;
      log('← Mutation berhasil: user id ' + newUser.id + ' dibuat', 'log-ok');
      log('← refetchQueries: GET_USERS dijalankan ulang...', 'log-cache');
      setTimeout(function() {
        log('← Cache terupdate dengan data terbaru', 'log-cache');
        renderUsers(mockUsers);
        document.getElementById('inputName').value = '';
        document.getElementById('inputEmail').value = '';
        document.getElementById('mutationStatus').textContent = '✅ User "' + name + '" berhasil ditambahkan!';
        btn.disabled = false;
        isCached = true;
      }, 500);
    }, 700);
  };
</script>
</body>
</html>`,
      hint: 'Klik "Load Users" untuk simulasi useQuery. Perhatikan log: klik sekali lagi dan lihat bahwa data diambil dari cache. Kemudian tambah user baru dan amati refetchQueries bekerja.'
    },
    {
      type: 'tip',
      title: 'Gunakan tag gql agar IDE bisa highlight syntax GraphQL',
      text: 'Install extension <b>GraphQL: Language Feature Support</b> di VS Code, lalu buat file <code>.graphqlrc.yml</code> yang menunjuk ke schema server. Setelah itu, semua string di dalam tag <code>gql`...`</code> akan mendapat syntax highlighting, autocomplete field, dan deteksi error langsung di editor — jauh lebih nyaman saat menulis query panjang.'
    },
    {
      type: 'warn',
      title: 'Jangan lupa ApolloProvider di root!',
      text: 'Jika kamu memanggil <code>useQuery</code> atau <code>useMutation</code> di dalam komponen yang <b>tidak dibungkus</b> oleh <code>ApolloProvider</code>, kamu akan mendapat error: <i>"Could not find "client" in the context of ApolloConsumer"</i>. Pastikan <code>ApolloProvider</code> ada di file <code>main.tsx</code> atau <code>index.tsx</code> — di paling luar, membungkus seluruh aplikasi.'
    },
    {
      type: 'vocab',
      items: [
        ['Apollo Client', 'Library JavaScript untuk menghubungkan aplikasi React dengan server GraphQL, sekaligus mengelola cache dan state data server.'],
        ['ApolloProvider', 'Komponen React yang menyuntikkan Apollo Client ke seluruh pohon komponen melalui React Context, sehingga semua hook Apollo bisa digunakan.'],
        ['useQuery', 'Hook React dari Apollo yang secara otomatis mengirim query GraphQL saat komponen dimount dan mengembalikan data, loading, dan error.'],
        ['useMutation', 'Hook React dari Apollo yang mengembalikan fungsi mutation. Mutation tidak dijalankan otomatis — harus dipanggil manual.'],
        ['InMemoryCache', 'Sistem penyimpanan data Apollo di memori browser. Mencegah double-fetch dan membuat UI reaktif saat data berubah.'],
        ['gql', 'Tag template literal dari Apollo yang mem-parse string query/mutation menjadi dokumen GraphQL yang bisa dibaca oleh library.'],
        ['refetchQueries', 'Opsi pada useMutation yang menentukan query mana yang harus dijalankan ulang setelah mutation berhasil, sehingga data di UI selalu sinkron.']
      ]
    }
  ],
  recap: [
    'Gunakan <code>npm install @apollo/client graphql</code> untuk menambahkan Apollo ke project Vite.',
    'Konfigurasi <code>ApolloClient</code> dengan <code>HttpLink</code> (URL server) dan <code>InMemoryCache</code> di file terpisah.',
    '<b>ApolloProvider</b> harus membungkus seluruh aplikasi di <code>main.tsx</code> agar semua hook bisa dipakai.',
    '<code>useQuery(GET_USERS)</code> otomatis fetch data saat mount, mengembalikan <code>{ data, loading, error }</code>.',
    '<code>useMutation(CREATE_USER)</code> mengembalikan fungsi yang dipanggil manual, plus <code>refetchQueries</code> untuk auto-sync data.'
  ]
});
