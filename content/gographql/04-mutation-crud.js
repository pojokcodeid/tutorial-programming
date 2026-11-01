/* ============================================================
   Contoh Project GraphQL (Go) — Bab 4: Resolver Mutation & CRUD
   ============================================================ */
'use strict';

window.GOGRAPHQL_LESSONS = window.GOGRAPHQL_LESSONS || [];

window.GOGRAPHQL_LESSONS.push({
  id: 'gographql-mutation-crud',
  title: 'Resolver Mutation: Create, Publish, Delete + Validasi',
  chapter: 'Proyek Blog GraphQL Go',
  duration: '25 menit',
  intro: [
    'Mutation adalah sisi tulis dari API kita. Pada bab ini tiga resolver Mutation proyek dibongkar tuntas: <b>createPost</b> (validasi input → cek penulis → simpan), <b>publishPost</b> (ubah satu kolom saja), dan <b>deletePost</b> (yang menyimpan pelajaran otorisasi — kita bahas mekanismenya di Bab 5, di sini fokus pada alur datanya).',
    'Satu kebiasaan yang ditekankan di sini: <b>validasi bukan hanya tugas skema</b>. Skema GraphQL menjamin tipe data (judul berupa teks, authorID berupa bilangan bulat), tetapi tidak menjamin nilai yang masuk akal (judul kosong, penulis tidak ada). Resolver adalah penjaga terakhir sebelum data masuk database.'
  ],
  objectives: [
    'Mengimplementasikan createPost dengan validasi input dan pengecekan foreign key penulis',
    'Memahami kenapa input mutation dibungkus input type (CreatePostInput) dan bukan argument lepas',
    'Menerapkan update hemat kolom dengan method Update GORM pada publishPost',
    'Mengembalikan objek hasil mutation lengkap dengan relasi agar klien tidak perlu query ulang',
    'Menguji ketiga mutation dari Playground dan cURL dengan variables'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Input Type: Membungkus Argument Mutation</h3><p>Skema kita mendeklarasikan <code>createPost(input: CreatePostInput!)</code> dengan input type berisi tiga field. GQLGen menerjemahkannya menjadi struct Go — dan inilah salah satu keunggulan skema-first: ketika suatu saat kamu menambah field ke input type, generate ulang akan menandai <b>persis</b> baris mana di resolver yang harus menyesuaikan.</p>'
    },
    {
      type: 'example',
      title: 'Deklarasi skema + struct hasil generate (models_gen.go)',
      lang: 'graphql',
      output: false,
      code: `# graph/schema.graphqls
input CreatePostInput {
  title: String!
  content: String!
  authorID: Int!
}

type Mutation {
  "Buat post baru (Published default false — draf)"
  createPost(input: CreatePostInput!): Post!
  "Terbitkan post (published -> true)"
  publishPost(id: Int!): Post!
  "Hapus post; hanya boleh penulisnya atau admin"
  deletePost(id: Int!): Boolean!
}`,
      explain: [
        'Bandingkan dengan gaya argument lepas <code>createPost(title: String!, content: String!, authorID: Int!)</code> — keduanya valid, tetapi input type lebih mudah tumbuh (tambah field tanpa mematahkan pemanggil lama) dan lebih ringkas dipakai dengan <b>variables</b> di klien.',
        '<code>deletePost</code> mengembalikan <code>Boolean!</code> — pola umum untuk operasi hapus: klien cukup tahu berhasil atau tidak, tidak ada entitas yang dikembalikan.'
      ]
    },
    {
      type: 'text',
      html: '<h3>createPost: Tiga Tahap yang Berurutan</h3><p>Resolver mutation yang baik mengikuti urutan tetap: <b>validasi input → verifikasi ke database → tulis</b>. Tahap kedua sering terlupa: <code>authorID: 999</code> lolos validasi skema (masih bilangan bulat), tetapi pasti gagal di foreign key MariaDB — dan pesan galat database mentah akan bocor ke klien. Lebih baik kita menangkapnya lebih dulu dengan pesan yang manusiawi.</p>'
    },
    {
      type: 'example',
      title: 'graph/schema.resolvers.go — CreatePost lengkap',
      lang: 'go',
      output: false,
      code: `func (r *mutationResolver) CreatePost(ctx context.Context, input model.CreatePostInput) (*model.Post, error) {
	// 1. Validasi input (GQLGen sudah menjamin tipenya, bukan nilainya)
	if input.Title == "" {
		return nil, errors.New("judul wajib diisi")
	}
	if len(input.Title) > 200 {
		return nil, errors.New("judul maksimal 200 karakter")
	}

	// 2. Penulis harus ada di database
	var author model.User
	if err := r.DB.WithContext(ctx).First(&author, input.AuthorID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("penulis dengan id tersebut tidak ditemukan")
		}
		return nil, errors.New("gagal membaca database")
	}

	// 3. Simpan post baru (Published default false = draf)
	post := model.Post{
		Title:   input.Title,
		Content: input.Content,
		Author:  &author,
	}
	if err := r.DB.WithContext(ctx).Create(&post).Error; err != nil {
		return nil, errors.New("gagal menyimpan post")
	}
	return &post, nil
}`,
      explain: [
        '<code>Create(&post)</code> mengeksekusi INSERT lalu <b>menuliskan kembali</b> ID dan CreatedAt hasil database ke struct — sehingga <code>post</code> yang dikembalikan sudah lengkap dan siap diserialisasi menjadi response GraphQL.',
        'Field <code>Author</code> diisi dari hasil tahap 2, sehingga klien yang meminta <code>createPost { title author { name } }</code> mendapat seluruhnya dalam satu mutation — tanpa query susulan.',
        'Pesan error memakai bahasa pengguna ("judul wajib diisi"), bukan istilah database — persis prinsip yang sama dengan materi GraphQL Node.'
      ]
    },
    {
      type: 'text',
      html: '<h3>publishPost: Update Hemat Kolom</h3><p>Pemula sering menulis <code>Save(&post)</code> setelah membaca post lengkap — menghasilkan UPDATE semua kolom demi mengubah satu bit. Cara yang benar: <b>Update satu kolom</b> dengan method <code>Update</code>, atau bahkan satu baris SQL <code>UPDATE ... WHERE id = ?</code> tanpa membaca dulu bila kamu hanya butuh kepastian baris ada.</p>'
    },
    {
      type: 'example',
      title: 'PublishPost — baca dulu (untuk relasi), lalu update satu kolom',
      lang: 'go',
      output: false,
      code: `func (r *mutationResolver) PublishPost(ctx context.Context, id int) (*model.Post, error) {
	var post model.Post
	if err := r.DB.WithContext(ctx).Preload("Author").First(&post, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("post tidak ditemukan")
		}
		return nil, errors.New("gagal membaca database")
	}

	// Update hanya kolom published — hemat query
	if err := r.DB.WithContext(ctx).Model(&post).Update("published", true).Error; err != nil {
		return nil, errors.New("gagal menerbitkan post")
	}
	post.Published = true
	return &post, nil
}`,
      explain: [
        'Dua langkah terlihat boros, tetapi justru tepat: <b>baca</b> dengan Preload agar response membawa author, lalu <b>update</b> hanya kolom <code>published</code> — menghasilkan <code>UPDATE posts SET published = true WHERE id = ?</code> yang ringan.',
        '<code>Model(&post).Update(...)</code> memakai post sebagai referensi (id-nya) tanpa menulis ulang seluruh field. Nilai <code>post.Published = true</code> disinkronkan manual karena GORM tidak mengubah struct in-memory pada Update kolom tunggal.',
        'Idempoten: menjalankan publishPost dua kali pada post yang sama tidak merusak apa pun — nilai published tetap true. Kebiasaan baik untuk API yang bisa dipanggil ulang.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Menguji Mutation dari Playground</h3><p>Di Playground, tulis mutation berikut. Perhatikan bahwa kami memakai <b>variables</b> (panel kanan bawah) — bukan menyalin nilai ke dalam string query. Ini best practice yang sama persis dengan materi GraphQL Node: query tetap konstan, data mengalir lewat variabel.</p>'
    },
    {
      type: 'example',
      title: 'Mutation siap tempel: buat, terbitkan, hapus',
      lang: 'graphql',
      output: false,
      code: `# 1. Buat post baru — salin juga blok variables-nya
mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    id
    title
    published
    author { name role }
  }
}

# Variables (panel bawah Playground):
# { "input": { "title": "Resensi Buku Go", "content": "Buku bagus.", "authorID": 1 } }

# 2. Terbitkan post id 2
mutation { publishPost(id: 2) { id title published } }

# 3. Uji validasi — kirim title kosong, harapkan:
#    { "errors": [{ "message": "judul wajib diisi" }] }
mutation ($input: CreatePostInput!) {
  createPost(input: $input) { id }
}`,
      explain: [
        'Urutan percobaan yang disarankan: buat post dengan authorID 1 (Budi) → berhasil; ulangi dengan authorID 999 → "penulis dengan id tersebut tidak ditemukan"; kirim judul kosong → "judul wajib diisi". Ketiga jalur validasi tadi teruji dalam tiga kirim.',
        'Variabel <code>$input</code> bertipe <code>CreatePostInput!</code> — GQLGen menghasilkan tipe Go-nya, sehingga menambah field baru ke input type nanti langsung terdeteksi compiler.'
      ]
    },
    {
      type: 'live',
      title: 'Simulasi: Tiga Tahap Validasi createPost',
      lang: 'html',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: system-ui, sans-serif; font-size: 13px; margin: 12px; background: #f8fafc; color: #0f172a; }
  h3 { margin: 0 0 8px; font-size: 14px; }
  .wrap { display: flex; gap: 14px; flex-wrap: wrap; }
  .col { flex: 1; min-width: 240px; }
  label { font-size: 11px; color: #64748b; display: block; margin: 6px 0 2px; }
  input, select, textarea { width: 100%; box-sizing: border-box; padding: 6px; border: 1px solid #cbd5e1;
                            border-radius: 6px; font-size: 12px; font-family: inherit; }
  button { padding: 8px 14px; border: 0; border-radius: 6px; font-weight: 700; cursor: pointer; color: #fff;
           background: #E10098; margin-top: 10px; }
  button:disabled { background: #94a3b8; cursor: wait; }
  .steps { list-style: none; margin: 10px 0; padding: 0; }
  .steps li { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; margin: 6px 0;
              display: flex; justify-content: space-between; opacity: .45; transition: all .3s; }
  .steps li.active { opacity: 1; border-color: #E10098; background: #fdf2f8; }
  .steps li.pass { opacity: 1; border-color: #22c55e; background: #f0fdf4; }
  .steps li.fail { opacity: 1; border-color: #ef4444; background: #fef2f2; }
  .resp { background: #0f172a; color: #94a3b8; border-radius: 6px; padding: 8px; min-height: 90px;
          font-family: monospace; font-size: 11px; white-space: pre-wrap; }
  .resp .ok { color: #4ade80; } .resp .bad { color: #f87171; }
  .hint { font-size: 11px; color: #64748b; margin-top: 6px; }
</style>
</head>
<body>
<h3>🛡️ Resolver CreatePost: validasi → cek penulis → INSERT</h3>
<div class="wrap">
  <div class="col">
    <label>Judul</label>
    <input id="title" value="Resensi Buku Go">
    <label>AuthorID (dikirim klien)</label>
    <select id="author">
      <option value="1">1 — Budi (ada di DB)</option>
      <option value="2">2 — Ani (ada di DB)</option>
      <option value="999">999 — TIDAK ada di DB</option>
    </select>
    <button id="btnGo">▶ Kirim mutation</button>
  </div>
  <div class="col">
    <ol class="steps" id="steps">
      <li data-i="0"><span>1. Validasi input</span><span>judul &amp; panjang</span></li>
      <li data-i="1"><span>2. Cek penulis di DB</span><span>SELECT users WHERE id</span></li>
      <li data-i="2"><span>3. Simpan post</span><span>INSERT INTO posts</span></li>
    </ol>
  </div>
</div>
<div class="resp" id="resp"><span>Tekan "Kirim mutation" — coba ubah judul kosong atau authorID 999.</span></div>
<div class="hint">Tahap yang gagal berhenti di situ — INSERT tidak pernah dijalankan. Bandingkan dengan pengalaman tanpa validasi: foreign key MariaDB yang menolak, dengan pesan galat mentah.</div>
<script>
  var running = false;
  function log(msg, cls) {
    var el = document.getElementById('resp');
    el.innerHTML += '\\n' + (cls ? '<span class="' + cls + '">' + msg + '</span>' : msg);
    el.scrollTop = el.scrollHeight;
  }
  document.getElementById('btnGo').onclick = function () {
    if (running) return;
    running = true;
    var btn = this; btn.disabled = true;
    var lis = document.querySelectorAll('#steps li');
    lis.forEach(function (li) { li.className = ''; });
    document.getElementById('resp').innerHTML = '';
    var title = document.getElementById('title').value;
    var author = document.getElementById('author').value;

    function step(i, cls, msg, delay, next) {
      setTimeout(function () {
        lis[i].className = cls;
        if (msg) log(msg, cls === 'fail' ? 'bad' : 'ok');
        if (next) next();
      }, delay);
    }

    // Tahap 1: validasi input
    step(0, 'active', '', 250, function () {
      if (title.trim() === '') {
        step(0, 'fail', '✗ errors: "judul wajib diisi" — resolver return error', 350, function () { done(); });
        return;
      }
      if (title.length > 200) {
        step(0, 'fail', '✗ errors: "judul maksimal 200 karakter"', 350, function () { done(); });
        return;
      }
      step(0, 'pass', '✓ input lolos validasi', 350, function () {
        // Tahap 2: cek penulis
        step(1, 'active', 'GORM ▸ SELECT * FROM users WHERE id = ' + author, 450, function () {
          if (author === '999') {
            step(1, 'fail', '✗ ErrRecordNotFound → "penulis dengan id tersebut tidak ditemukan"', 400, function () { done(); });
            return;
          }
          step(1, 'pass', '✓ penulis ditemukan (preloaded untuk response)', 350, function () {
            // Tahap 3: simpan
            step(2, 'active', 'GORM ▸ INSERT INTO posts (title, content, published, author_id) VALUES (...)', 500, function () {
              step(2, 'pass', '✓ 200 OK → {"data":{"createPost":{"id":5,...}}}', 400, function () { done(); });
            });
          });
        });
      });
    });

    function done() { running = false; btn.disabled = false; }
  };
</script>
</body>
</html>`,
      hint: 'Coba empat skenario: judul normal + author 1 (tiga tahap hijau, INSERT berjalan), judul kosong (gagal tahap 1), judul lebih dari 200 karakter, dan authorID 999 (gagal tahap 2 — INSERT tidak pernah dijalankan). Perhatikan pesan error selalu manusiawi, bukan galat database.'
    },
    {
      type: 'example',
      title: 'Memanggil mutation dari cURL (di luar Playground)',
      lang: 'bash',
      output: false,
      code: `curl -s http://localhost:4000/graphql \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "mutation($input: CreatePostInput!) { createPost(input: $input) { id title author { name } } }",
    "variables": { "input": { "title": "Belajar GORM", "content": "Where, First, Find, Create.", "authorID": 2 } }
  }'`,
      explain: [
        'Body JSON berisi dua kunci: <code>query</code> (statis) dan <code>variables</code> (data) — konvensi standar protokol GraphQL yang berlaku di klien mana pun: Apollo Client, fetch, cURL, atau Postman.',
        'Variabel membuat mutation ini bisa langsung dipakai skrip otomasi tanpa menyusun ulang string GraphQL — perhatikan tanda kutip harus JSON-valid.'
      ]
    },
    {
      type: 'tip',
      title: 'Order urutan validasi itu menghemat database',
      text: 'Selalu letakkan validasi termurah di depan: cek string kosong dulu (tanpa sentuh database), baru SELECT penulis, baru INSERT. Membalik urutannya berarti membebani database dengan permintaan yang sebenarnya pasti gagal.'
    },
    {
      type: 'warn',
      title: 'Satu resolver belum bertransaksi',
      text: 'createPost di proyek ini dua langkah terpisah (SELECT penulis, INSERT post) tanpa transaction — aman karena keduanya tidak saling bergantung data. Namun bila operasimu melibatkan banyak tabel dalam satu aksi (misal: pindah saldo), bungkus dengan <code>r.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error { ... })</code> agar tidak pernah setengah jadi.'
    },
    {
      type: 'vocab',
      items: [
        ['Input type', 'Tipe khusus argument mutation (CreatePostInput) — membungkus banyak field agar mutation mudah tumbuh dan kompatibel variables.'],
        ['Create', 'Method GORM untuk INSERT — mengisi kembali ID dan CreatedAt hasil database ke struct lewat pemanggilan pointer.'],
        ['Update kolom tunggal', 'Model(&post).Update("published", true) — hanya kolom itu yang ditulis; hemat dan minim konflik.'],
        ['Idempoten', 'Sifat operasi yang aman dijalankan berulang dengan hasil sama — publish dua kali tetap benar.'],
        ['Foreign key check', 'Pengecekan eksplisit bahwa penulis ada sebelum INSERT — memberi pesan ramah alih-alih galat 1452 dari MariaDB.'],
        ['Variables', 'Bagian request GraphQL berisi data pengganti $variabel — memisahkan query (statis) dari data (berubah).'],
        ['Errors GraphQL', 'Bagian respons berisi daftar { message } — dikembalikan dengan status HTTP 200, berbeda konvensi REST.'],
        ['Transaction', 'Fitur GORM membungkus banyak operasi dalam satu unit gagal-bersama (commit/rollback) — wajib untuk aksi multi-tabel.']
      ]
    }
  ],
  recap: [
    'Input mutation dibungkus <b>input type</b> (<code>CreatePostInput</code>) — mudah tumbuh dan kompatibel variables.',
    'createPost mengikuti urutan <b>validasi → cek penulis → INSERT</b>: murah di depan, mahal di belakang.',
    'Skema menjamin tipe, resolver menjamin <b>nilai</b> — judul kosong dan penulis 999 ditolak dengan pesan manusiawi.',
    'publishPost memakai <b>Update kolom tunggal</b> — bukan Save seluruh struct.',
    'Objek hasil mutation dikembalikan lengkap dengan relasi sehingga klien tidak perlu query susulan.',
    'Mutation diuji dari Playground dengan variables, dan dari cURL dengan body JSON query + variables.'
  ]
});
