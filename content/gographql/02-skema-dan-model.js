/* ============================================================
   Contoh Project GraphQL (Go) — Bab 2: Skema, Konfigurasi & Model
   ============================================================ */
'use strict';

window.GOGRAPHQL_LESSONS = window.GOGRAPHQL_LESSONS || [];

window.GOGRAPHQL_LESSONS.push({
  id: 'gographql-skema-model',
  title: 'Skema, Konfigurasi GQLGen & Model GORM',
  chapter: 'Proyek Blog GraphQL Go',
  duration: '20 menit',
  intro: [
    'Inti sebuah proyek GQLGen adalah satu file: <b><code>graph/schema.graphqls</code></b>. Semua yang lain — struct Go, interface resolver, kode transportasi — lahir dari file ini lewat perintah generate. Karena itu, menguasai cara menulis dan mengkonfigurasi skema adalah keterampilan paling penting dalam proyek ini.',
    'Pada bab ini kita membongkar tiga file kunci: <b>schema.graphqls</b> (kontrak API), <b>gqlgen.yml</b> (instruksi generate), dan <b>model kustom GORM</b> (struct Post & User dengan tag relasi). Bagian terakhir menyelesaikan jebakan paling umum pemula Go: relasi yang gagal karena foreign key tidak dideklarasikan.'
  ],
  objectives: [
    'Menulis skema GraphQL lengkap: scalar DateTime, type, input, argument opsional, dan dokumentasi deskripsi',
    'Mengkonfigurasi gqlgen.yml: lokasi skema, target generate, dan pemetaan tipe kustom',
    'Membedakan models_gen.go (generate) dari model kustom (tulisan sendiri) dan kapan memakai masing-masing',
    'Mendeklarasikan relasi GORM satu-ke-banyak dengan foreign key eksplisit (AuthorID)',
    'Menjalankan siklus "ubah skema → generate → compile" dengan aman'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>File 1: schema.graphqls — Kontrak API</h3><p>Berikut skema lengkap proyek blog kita. Perhatikan beberapa hal yang sengaja dipilih: penamaan <b>camelCase</b> (konvensi GraphQL publik, bukan huruf kapital khas Go), <b>deskripsi</b> di atas field (muncul sebagai tooltip di Playground), dan argument opsional <code>published: Boolean</code> tanpa tanda <code>!</code>.</p>'
    },
    {
      type: 'example',
      title: 'graph/schema.graphqls — skema lengkap proyek',
      lang: 'graphql',
      output: false,
      code: `scalar DateTime

type User {
  id: Int!
  name: String!
  email: String!
  "Peran pengguna: USER atau ADMIN — dipakai otorisasi"
  role: String!
  createdAt: DateTime!
  posts: [Post!]!
}

type Post {
  id: Int!
  title: String!
  content: String!
  published: Boolean!
  createdAt: DateTime!
  author: User!
}

type Query {
  "Daftar post; filter opsional published=true/false"
  posts(published: Boolean): [Post!]!
  "Detail satu post berdasarkan id; null bila tidak ada"
  post(id: Int!): Post
  "Semua pengguna beserta postnya"
  users: [User!]!
  "Jumlah total post (untuk indikator dashboard)"
  postCount: Int!
}

input CreatePostInput {
  title: String!
  content: String!
  authorID: Int!
}

type Mutation {
  "Buat post baru (published default false — draf)"
  createPost(input: CreatePostInput!): Post!
  "Terbitkan post (published -> true)"
  publishPost(id: Int!): Post!
  "Hapus post; hanya boleh penulisnya atau admin"
  deletePost(id: Int!): Boolean!
}`,
      explain: [
        '<code>scalar DateTime</code> mendeklarasikan tipe waktu; di <code>gqlgen.yml</code> kita memetakannya ke <code>graphql.Time</code> agar menjadi <code>time.Time</code> Go — cocok dengan kolom DATETIME MariaDB.',
        '<code>post(id: Int!): Post</code> tanpa <code>!</code> di hasil berarti <b>nullabel</b> — resolver boleh mengembalikan nil bila tidak ditemukan (bandingkan dengan <code>Post!</code> yang akan error).',
        'Deskripsi string sebelum field ("<code>"Daftar post..."</code>") adalah dokumentasi bawaan GraphQL — muncul otomatis di Playground dan Introspection, tanpa file docs terpisah.'
      ]
    },
    {
      type: 'text',
      html: '<h3>File 2: gqlgen.yml — Instruksi Generate</h3><p>Konfigurasi ini menjawab dua pertanyaan: <b>di mana skema</b> dan <b>ke mana kode dihasilkan</b>. Bagian paling penting untuk proyek kita adalah blok <code>models</code> — di situlah kita mengarahkan tipe GraphQL ke struct milik kita sendiri.</p>'
    },
    {
      type: 'example',
      title: 'gqlgen.yml — konfigurasi lengkap proyek',
      lang: 'yaml',
      output: false,
      code: `# Lokasi skema GraphQL (kontrak API)
schema:
  - graph/*.graphqls

# Executable Schema — hasil generate, jangan diedit manual
exec:
  filename: graph/generated/generated.go
  package: generated

# Struct model — hasil generate dari schema
model:
  filename: graph/model/models_gen.go
  package: model

# Pemetaan tipe kustom — kunci proyek ini:
models:
  # Agar CreatedAt cocok dengan kolom DATETIME MariaDB & time.Time GORM
  DateTime:
    model: github.com/99designs/gqlgen/graphql.Time
  # Struct GORM milik kita (dengan tag relasi) — lihat graph/model/
  Post:
    model: example.com/graphql-go-blog/graph/model.Post
  User:
    model: example.com/graphql-go-blog/graph/model.User

# Resolvers mengikuti lokasi skema
resolver:
  layout: follow-schema
  dir: graph
  package: graph
  filename_template: "{name}.resolvers.go"`,
      explain: [
        'Blok <code>models</code> membuat GQLGen memakai struct kita (Post/User) alih-alih membuat versi generate — inilah yang membuat tag GORM (<code>gorm:"..."</code>) bisa hidup berdampingan dengan GraphQL.',
        'Nilai model module diawali <code>example.com/graphql-go-blog</code> — <b>sesuaikan dengan nama modulmu</b> (lihat baris pertama <code>go.mod</code>) saat membangun proyek serupa.',
        'Layout resolver <code>follow-schema</code> menghasilkan <code>schema.resolvers.go</code> di samping skema — satu file untuk semua resolver, mudah dipindai.'
      ]
    },
    {
      type: 'text',
      html: '<h3>File 3: Model Kustom GORM — Tempat Jebakan Foreign Key</h3><p>Kalau Post dan User cukup di-generate, kenapa menulis struct sendiri? Karena <b>GORM butuh deklarasi relasi yang eksplisit</b>. Struct hasil generate tidak memiliki field <code>AuthorID</code>, sehingga GORM gagal memetakan relasi dan <code>AutoMigrate</code> langsung gagal dengan pesan seperti <code>define a valid foreign key for relations</code>. Inilah kenapa dua file ini ditulis tangan:</p>'
    },
    {
      type: 'example',
      title: 'graph/model/post.go & user.go — struct GORM dengan relasi',
      lang: 'go',
      output: false,
      code: `// graph/model/post.go
package model

import "time"

type Post struct {
	ID        int       \`json:"ID" gorm:"primaryKey"\`
	Title     string    \`json:"Title" gorm:"size:200;not null"\`
	Content   string    \`json:"Content" gorm:"type:text"\`
	Published bool      \`json:"Published" gorm:"default:false"\`
	CreatedAt time.Time \`json:"CreatedAt"\`

	// Relasi banyak-ke-satu: post punya satu penulis.
	// AuthorID adalah foreign key — tanpa field ini GORM tidak bisa
	// memetakan relasi Author (kesalahan paling umum pemula).
	AuthorID int   \`json:"-" gorm:"not null;index"\` // kolom di DB, tidak diekspos
	Author   *User \`json:"Author" gorm:"foreignKey:AuthorID;references:ID"\`
}

// graph/model/user.go
type User struct {
	ID        int       \`json:"ID" gorm:"primaryKey"\`
	Name      string    \`json:"Name" gorm:"size:100;not null"\`
	Email     string    \`json:"Email" gorm:"size:100;uniqueIndex;not null"\`
	Role      string    \`json:"Role" gorm:"size:10;not null;default:USER"\`
	CreatedAt time.Time \`json:"CreatedAt"\`

	// Relasi satu-ke-banyak: satu user punya banyak post.
	Posts []*Post \`json:"Posts" gorm:"foreignKey:AuthorID;references:ID"\`
}`,
      explain: [
        'Pemetaannya: skema <code>Post.author</code> → struct <code>Author *User</code>; kolom <code>author_id</code> di MariaDB ← field <code>AuthorID</code> yang tidak diekspos ke GraphQL (tag <code>json:"-"</code>).',
        '<code>foreignKey:AuthorID;references:ID</code> menyatakan pasangan relasi secara eksplisit: kunci asing di struct ini, merujuk kolom ID di struct lawan.',
        'Tag <code>uniqueIndex</code> pada Email membuat GORM membuat indeks unik — duplikasi email langsung ditolak database, bukan hanya oleh aplikasi.'
      ]
    },
    {
      type: 'example',
      title: 'Siklus kerja: ubah skema → generate → compile',
      lang: 'bash',
      output: false,
      code: `# CONTOH NYATA perubahan: tambahkan field "views: Int!" ke type Post
# 1. Edit graph/schema.graphqls, simpan

# 2. Regenerasi (binary gqlgen — install sekali dengan:
#    go install github.com/99designs/gqlgen@v0.17.98)
gqlgen generate

# 3. Coba build — compiler Go menjadi "checker" skema-mu:
go build ./...

#    Bila ada resolver yang belum menyesuaikan, compiler menunjuk
#    persis file dan barisnya. Perbaiki lalu ulangi.

# 4. Bila perlu, tambahkan field Views ke struct Post (model kustom)
#    dengan tag gorm — lalu jalankan lagi server: tabel ikut ter-update
#    (AutoMigrate menambah kolom, tidak menghapus data).

# Tips macOS: file ._* (resource fork) bisa merusak baca skema:
find . -name '._*' -delete && gqlgen generate`,
      explain: [
        'Siklus ini inti dari seluruh pengembangan GQLGen: <b>schema dulu, kode menyusul</b>. Compiler Go berperan sebagai penjaga konsistensi — Anda tidak bisa lupa mengimplementasikan resolver baru.',
        '<code>go build ./...</code> membangun seluruh package — jalankan sebelum <code>go run .</code> agar error tipe tertangkap dalam hitungan detik.',
        'AutoMigrate bersifat <b>menambah</b> kolom baru, tidak pernah menghapus — aman untuk pengembangan, tapi perubahan destruktif (rename/hapus kolom) harus via migrasi SQL manual di produksi.'
      ]
    },
    {
      type: 'live',
      title: 'Simulasi: Skema → Struct Go → Kolom Database',
      lang: 'html',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: system-ui, sans-serif; font-size: 13px; margin: 12px; background: #f8fafc; color: #0f172a; }
  h3 { margin: 0 0 8px; font-size: 14px; }
  .cols { display: flex; gap: 10px; flex-wrap: wrap; }
  .col { flex: 1; min-width: 210px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; }
  .col h4 { margin: 0 0 8px; font-size: 12px; color: #475569; text-transform: uppercase; letter-spacing: .5px; }
  pre { background: #0f172a; color: #94a3b8; border-radius: 6px; padding: 8px; font-family: monospace;
        font-size: 11px; white-space: pre-wrap; margin: 0; min-height: 150px; }
  pre .hl { color: #f472b6; font-weight: 700; }
  pre .ok { color: #4ade80; }
  pre .bad { color: #f87171; }
  .fields { display: flex; gap: 6px; flex-wrap: wrap; margin: 8px 0; }
  .fbtn { padding: 5px 10px; border: 1px solid #e2e8f0; border-radius: 999px; background: #f8fafc;
          cursor: pointer; font-size: 11px; font-family: monospace; }
  .fbtn.on { background: #E10098; color: #fff; border-color: #E10098; }
  .chk { font-size: 12px; margin: 6px 0; }
  .verdict { margin-top: 8px; padding: 8px; border-radius: 6px; font-size: 12px; font-weight: 700; }
  .verdict.ok { background: #dcfce7; color: #15803d; }
  .verdict.bad { background: #fee2e2; color: #b91c1c; }
</style>
</head>
<body>
<h3>🔄 Pemetaan tiga arah: skema GraphQL ↔ struct Go ↔ kolom MariaDB</h3>
<div class="fields" id="fields"></div>
<div class="chk"><label><input type="checkbox" id="fkey"> Sertakan field AuthorID (foreign key) di struct Post</label></div>
<div class="cols">
  <div class="col"><h4>1 · Skema (schema.graphqls)</h4><pre id="sdl"></pre></div>
  <div class="col"><h4>2 · Struct Go (model kustom)</h4><pre id="go"></pre></div>
  <div class="col"><h4>3 · Tabel MariaDB (AutoMigrate)</h4><pre id="sql"></pre></div>
</div>
<div class="verdict" id="verdict"></div>
<script>
  // Data pemetaan: tiap field punya baris di tiga panel
  var FIELDS = [
    { gql: 'id: Int!', go: 'ID        int    \`gorm:"primaryKey"\`', col: 'id INT AUTO_INCREMENT PRIMARY KEY' },
    { gql: 'title: String!', go: 'Title     string \`gorm:"size:200;not null"\`', col: 'title VARCHAR(200) NOT NULL' },
    { gql: 'content: String!', go: 'Content   string \`gorm:"type:text"\`', col: 'content TEXT' },
    { gql: 'published: Boolean!', go: 'Published bool   \`gorm:"default:false"\`', col: 'published BOOLEAN DEFAULT false' },
    { gql: 'createdAt: DateTime!', go: 'CreatedAt time.Time', col: 'created_at DATETIME' },
    { gql: 'author: User!', go: 'Author   *User \`gorm:"foreignKey:AuthorID"\`', col: '-- (relasi, bukan kolom)', rel: true }
  ];
  var FK = { gql: '(tidak diekspos — json:"-")', go: 'AuthorID int   \`gorm:"not null;index"\`', col: 'author_id INT NOT NULL, INDEX' };
  var active = 0;

  function render() {
    var withFK = document.getElementById('fkey').checked;
    var sdl = '', goc = '', sql = '';
    FIELDS.forEach(function (f, i) {
      var mark = i === active ? 'hl' : '';
      sdl += '<span class="' + mark + '">' + f.gql + '</span>\\n';
      goc += '<span class="' + mark + '">' + f.go + '</span>\\n';
      if (!f.rel) sql += '<span class="' + mark + '">' + f.col + '</span>\\n';
    });
    if (withFK) {
      goc += '<span class="ok">' + FK.go + '</span>\\n';
      sql += '<span class="ok">' + FK.col + '</span>\\n';
    }
    document.getElementById('sdl').innerHTML = 'type Post {\\n  ' + sdl + '}';
    document.getElementById('go').innerHTML = 'type Post struct {\\n  ' + goc + '}';
    document.getElementById('sql').innerHTML = 'CREATE TABLE posts (\\n  ' + sql + ');';

    var v = document.getElementById('verdict');
    if (withFK) {
      v.className = 'verdict ok';
      v.textContent = '✓ Lengkap — AutoMigrate berhasil; Preload("Author") bisa memuat relasi.';
    } else {
      v.className = 'verdict bad';
      v.textContent = '✗ GAGAL: "invalid field found for struct Post\'s field Author: define a valid foreign key for relations" — AuthorID wajib ada!';
    }
  }

  // tombol pemilih field
  var fw = document.getElementById('fields');
  FIELDS.forEach(function (f, i) {
    var b = document.createElement('button');
    b.className = 'fbtn' + (i === 0 ? ' on' : '');
    b.textContent = f.gql.split(':')[0];
    b.onclick = function () {
      active = i;
      document.querySelectorAll('.fbtn').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      render();
    };
    fw.appendChild(b);
  });
  document.getElementById('fkey').onchange = render;
  render();
</script>
</body>
</html>`,
      hint: 'Klik tiap nama field untuk melihat barisnya disorot di tiga panel sekaligus. Lalu centang/sentuh checkbox "AuthorID" — perhatikan bagaimana keberadaan satu field foreign key menentukan berhasil-gagalnya AutoMigrate dan Preload relasi.'
    },
    {
      type: 'tip',
      title: 'Kapan cukup pakai model generate?',
      text: 'Untuk tipe sederhana tanpa relasi database (misal <code>CreatePostInput</code>, enum status), model generate sudah lebih dari cukup — biarkan <code>models_gen.go</code> mengurusnya. Tulis model kustom hanya untuk entitas yang punya <b>relasi, indeks, atau konvensi kolom</b> yang harus dikontrol (di proyek ini: Post dan User).'
    },
    {
      type: 'warn',
      title: 'Nama modul di gqlgen.yml harus cocok dengan go.mod',
      text: 'Blok <code>models</code> dan <code>exec</code> memakai path module penuh (<code>example.com/graphql-go-blog/...</code>). Saat membuat proyek sendiri dengan nama berbeda (misal <code>github.com/kamu/blog</code>), semua path di <code>gqlgen.yml</code> harus ikut diganti — jika tidak, generate gagal dengan pesan <code>package ... is not in std</code> atau tipe tidak dikenali.'
    },
    {
      type: 'vocab',
      items: [
        ['schema.graphqls', 'File definisi skema GraphQL — sumber kebenaran tunggal proyek GQLGen; semua kode lain lahir darinya.'],
        ['gqlgen.yml', 'Berkas konfigurasi GQLGen: lokasi skema, tujuan hasil generate, dan pemetaan tipe kustom (blok models).'],
        ['Scalar DateTime', 'Tipe waktu kustom di skema; dipetakan ke graphql.Time sehingga menjadi time.Time pada struct Go.'],
        ['Foreign key eksplisit', 'Field AuthorID pada struct Post — prasyarat GORM untuk memetakan relasi Author/Posts; tanpanya AutoMigrate gagal.'],
        ['foreignKey tag', 'Annotasi gorm:"foreignKey:AuthorID;references:ID" yang menyatakan pasangan kolom relasi secara eksplisit.'],
        ['models_gen.go', 'File hasil generate berisi struct untuk tipe yang TIDAK dikustom — jangan diedit, akan ditimpa generate ulang.'],
        ['AutoMigrate', 'Mekanisme GORM yang menyinkronkan tabel mengikuti struct model — menambah kolom baru tanpa menghapus data.'],
        ['camelCase', 'Konvensi penamaan GraphQL (id, createdAt) yang kita pakai agar API terasa natural bagi klien JavaScript/TypeScript.']
      ]
    }
  ],
  recap: [
    'Tiga file inti bab ini: <b>schema.graphqls</b> (kontrak API), <b>gqlgen.yml</b> (instruksi generate + pemetaan tipe), dan <b>model kustom</b> (struct GORM dengan tag relasi).',
    'Skema memakai <b>camelCase</b> dan <b>deskripsi field</b> — dokumentasi hidup yang otomatis tampil di Playground.',
    'Blok <code>models</code> di gqlgen.yml mengarahkan <code>Post</code>/<code>User</code> ke struct kita dan <code>DateTime</code> ke <code>time.Time</code>.',
    'Jebakan terbesar: relasi GORM <b>wajib punya foreign key eksplisit</b> (<code>AuthorID</code>) — tanpanya AutoMigrate gagal dengan pesan "define a valid foreign key".',
    'Siklus pengembangan: edit skema → <code>gqlgen generate</code> → <code>go build ./...</code> → perbaiki hingga compile → jalankan server.',
    'Model kustom hanya untuk entitas berrelasi; tipe sederhana (input, enum) cukup memakai hasil generate.'
  ]
});
