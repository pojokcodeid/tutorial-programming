/* ============================================================
   Contoh Project GraphQL (Go) — Bab 5: Context, Auth & Otorisasi
   ============================================================ */
'use strict';

window.GOGRAPHQL_LESSONS = window.GOGRAPHQL_LESSONS || [];

window.GOGRAPHQL_LESSONS.push({
  id: 'gographql-context-otorisasi',
  title: 'Context, Middleware & Otorisasi: deletePost',
  chapter: 'Proyek Blog GraphQL Go',
  duration: '25 menit',
  intro: [
    'Resolver <code>deletePost</code> adalah operasi paling berbahaya di API kita — dan karena itu menjadi studi kasus terbaik untuk dua konsep penting: <b>context</b> (membawa identitas pengguna login ke dalam resolver) dan <b>otorisasi</b> (memutuskan siapa boleh melakukan apa).',
    'Pola yang dipakai proyek ini identik dengan materi <b>Bab 12 Keamanan & Otorisasi</b> pada tutorial GraphQL Node: middleware membaca token sekali per request, menyuntikkan pengguna ke context, lalu resolver memeriksanya. Hanya wadahnya yang berbeda: di Go, context dipasang melalui <code>context.Context</code> dengan tipe kunci bertipe ketat.'
  ],
  objectives: [
    'Memahami peran context.Context sebagai pembawa identitas per-request di Go',
    'Membaca dan menulis context helper: WithCurrentUser, CurrentUserFrom, AuthenticateFromHeader',
    'Mengimplementasikan authMiddleware HTTP yang menyuntikkan pengguna login ke context',
    'Menerapkan otorisasi field-level di resolver: hanya penulis atau admin yang boleh menghapus',
    'Menguji empat skenario otorisasi (anonim, penulis, admin, pihak ketiga) lewat header X-User-ID'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Masalah: Siapa yang Memanggil Resolver?</h3><p>HTTP bersifat <b>stateless</b> — setiap request tiba tanpa ingatan terhadap request sebelumnya. Ketika mutation <code>deletePost(id: 2)</code> masuk, resolver harus tahu siapa pengirimnya. Di Node/Apollo, jawabannya adalah context object per-request. Di Go, alat serupa adalah <b><code>context.Context</code></b>: tas berlabel yang dibawa dari middleware menuju setiap resolver pada request yang sama.</p><p>Tiga langkah kerjanya: <b>(1)</b> middleware membaca header <code>X-User-ID</code> dan memverifikasi id ke database; <b>(2)</b> hasil verifikasi disimpan ke context dengan kunci bertipe; <b>(3)</b> resolver membaca kunci itu kapan pun perlu.</p>'
    },
    {
      type: 'example',
      title: 'graph/context.go — helper context lengkap',
      lang: 'go',
      output: false,
      code: `package graph

import (
	"context"
	"strconv"

	"example.com/graphql-go-blog/graph/model"

	"gorm.io/gorm"
)

// ctxKey bertipe int — kunci context bertipe mencegah tabrakan dengan
// package lain (jangan pernah memakai string sebagai kunci context).
type ctxKey int

const currentUserKey ctxKey = 1

// WithCurrentUser menyuntikkan pengguna ke context (dipanggil middleware).
func WithCurrentUser(ctx context.Context, u *model.User) context.Context {
	return context.WithValue(ctx, currentUserKey, u)
}

// CurrentUserFrom mengambil pengguna login dari context; nil bila anonim.
func CurrentUserFrom(ctx context.Context) *model.User {
	u, _ := ctx.Value(currentUserKey).(*model.User)
	return u
}

// AuthenticateFromHeader membaca header simulasi "X-User-ID":
// valid angka & ada di database → pengguna login; selain itu → anonim.
func AuthenticateFromHeader(ctx context.Context, db *gorm.DB, header string) context.Context {
	if header == "" {
		return ctx
	}
	id, err := strconv.Atoi(header)
	if err != nil || id <= 0 {
		return ctx
	}
	var u model.User
	if err := db.First(&u, id).Error; err != nil {
		return ctx // id tidak ada di database → tetap anonim
	}
	return WithCurrentUser(ctx, &u)
}`,
      explain: [
        'Tipe kunci <code>ctxKey int</code> adalah idiom Go: dua package dengan kunci bertipe berbeda tidak akan pernah tabrakan walau nilai angkanya sama — sesuatu yang tidak terjamin bila memakai string.',
        '<code>ctx.Value(currentUserKey).(*model.User)</code> adalah type assertion dengan dua hasil; tanda <code>_</code> menelan "ok"-nya sehingga nil dikembalikan bila kunci tidak ada atau tipenya salah. Resolusi resolver terhadap pengguna anonim tetap aman.',
        'Perhatikan <b>kegagalan diam-diam yang disengaja</b>: id bukan angka, id tidak ada di database, atau header kosong — semuanya berakhir sebagai pengguna anonim (bukan error 400). Verifikasi token yang gagal berarti "tidak login", bukan "request rusak".'
      ]
    },
    {
      type: 'text',
      html: '<h3>Middleware: Menyuntikkan Context Sebelum Resolver</h3><p>Autentikasi dilakukan <b>sekali per request</b> di lapisan HTTP, bukan di tiap resolver. <code>main.go</code> memasang <code>authMiddleware</code> di depan server GQLGen, sehingga setiap resolver yang berjalan sesudahnya tinggal membaca hasilnya.</p>'
    },
    {
      type: 'example',
      title: 'main.go — authMiddleware + pemasangan route',
      lang: 'go',
      output: false,
      code: `// 4. Playground di "/", endpoint GraphQL di "/graphql"
http.Handle("/", playground.Handler("Blog GQLGen", "/graphql"))
http.Handle("/graphql", auth)

// authMiddleware menyuntikkan pengguna login ke context sebelum
// request masuk ke resolver — pola yang sama dengan buildContext Apollo.
func authMiddleware(db *gorm.DB, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := graph.AuthenticateFromHeader(r.Context(), db, r.Header.Get("X-User-ID"))
		// Header CORS sederhana agar Playground lintas-origin tetap jalan
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-User-ID")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}`,
      explain: [
        'Bandingkan dengan <code>startStandaloneServer</code> pada materi Node: fungsi <code>context</code> di Apollo dipanggil sekali per request untuk mengisi context object. Di Go, peran itu dipegang middleware HTTP — konsepnya sama, alatnya berbeda.',
        '<code>r.WithContext(ctx)</code> menghasilkan salinan request dengan context baru; server GQLGen akan mewariskannya hingga ke resolver. Inilah jalur resmi Go membawa data per-request.',
        'Blok <code>OPTIONS</code> menangani preflight CORS — tanpanya Playground di origin lain (atau React dev server) tidak bisa mengirim header <code>X-User-ID</code>.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Otorisasi: Menjaga deletePost</h3><p>Sekarang resolver intinya. Dua pemeriksaan berlapis: <b>harus login</b> (context membawa pengguna), lalu <b>harus penulis post atau admin</b>. Catatan keamanan penting: perbandingan kepemilikan memakai data dari <b>database</b>, bukan klaim apa pun dari klien.</p>'
    },
    {
      type: 'example',
      title: 'schema.resolvers.go — DeletePost dengan otorisasi berlapis',
      lang: 'go',
      output: false,
      code: `func (r *mutationResolver) DeletePost(ctx context.Context, id int) (bool, error) {
	var post model.Post
	if err := r.DB.WithContext(ctx).First(&post, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, errors.New("post tidak ditemukan")
		}
		return false, errors.New("gagal membaca database")
	}

	// "Pengguna login" disimulasikan lewat context (lihat middleware di main.go)
	currentUser := CurrentUserFrom(ctx)
	if currentUser == nil {
		return false, errors.New("silakan login dulu (set header X-User-ID)")
	}
	// Otorisasi: baca data dari database — jangan percayai id dari klien
	if post.Author == nil {
		_ = r.DB.WithContext(ctx).Preload("Author").First(&post, id)
	}
	isAuthor := post.Author != nil && post.Author.ID == currentUser.ID
	if !isAuthor && currentUser.Role != "ADMIN" {
		return false, errors.New("hanya penulis atau admin yang boleh menghapus post ini")
	}

	if err := r.DB.WithContext(ctx).Delete(&post).Error; err != nil {
		return false, errors.New("gagal menghapus post")
	}
	return true, nil
}`,
      explain: [
        'Urutan pemeriksaan mengikuti pola <b>autentikasi → otorisasi → aksi</b>: baca post dulu (agar 404 lebih informatif), pastikan login, baru cocokkan kepemilikan. Pesan error membedakan "belum login" dari "tidak berhak" — persis perbedaan 401 vs 403 pada REST.',
        '<code>isAuthor || role == "ADMIN"</code> adalah aturan bisnis proyek: penulis bebas menghapus tulisannya sendiri, admin menghapus apa pun. Aturan semacam ini selalu hidup di resolver (bukan middleware) karena baru di resolver konteks objeknya (post mana?) tersedia.',
        '<code>Delete(&post)</code> menghasilkan <code>DELETE FROM posts WHERE id = ?</code>. Proyek ini memakai hard delete; bila memilih soft delete, tambahkan kolom deletedAt dan GORM otomatis mengubah Delete menjadi update tersembunyi.'
      ]
    },
    {
      type: 'live',
      title: 'Simulasi: Papan Kendali Otorisasi deletePost',
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
  .ctl { margin: 8px 0; }
  label { font-size: 11px; color: #64748b; display: block; margin-bottom: 2px; }
  select { padding: 6px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px; width: 100%; box-sizing: border-box; }
  button { padding: 8px 14px; border: 0; border-radius: 6px; font-weight: 700; cursor: pointer; color: #fff;
           background: #E10098; margin-top: 8px; }
  .verdict { margin-top: 10px; padding: 10px; border-radius: 8px; font-size: 13px; font-weight: 700; }
  .verdict.ok { background: #dcfce7; color: #15803d; }
  .verdict.bad { background: #fee2e2; color: #b91c1c; }
  .log { background: #0f172a; color: #94a3b8; border-radius: 6px; padding: 8px; min-height: 160px; max-height: 200px;
         overflow-y: auto; font-family: monospace; font-size: 11px; white-space: pre-wrap; margin-top: 10px; }
  .log .ok { color: #4ade80; } .log .bad { color: #f87171; } .log .info { color: #7dd3fc; }
  .hint { font-size: 11px; color: #64748b; margin-top: 6px; }
  table { border-collapse: collapse; font-size: 11px; margin-top: 8px; width: 100%; }
  th, td { border: 1px solid #e2e8f0; padding: 4px 6px; text-align: left; }
  th { background: #f1f5f9; }
  .yes { color: #15803d; font-weight: 700; } .no { color: #b91c1c; }
</style>
</head>
<body>
<h3>🔐 deletePost(id: 2) — bolehkah si A menghapus post milik B (authorID: 1)?</h3>
<div class="wrap">
  <div class="col">
    <div class="ctl">
      <label>Header X-User-ID yang dikirim</label>
      <select id="user">
        <option value="0">(tanpa header) — anonim</option>
        <option value="1">1 — Budi Santoso (ADMIN)</option>
        <option value="2">2 — Ani Rahayu (USER)</option>
        <option value="3">3 — Citra Lestari (USER)</option>
        <option value="99">99 — id tidak ada di database</option>
      </select>
    </div>
    <button id="btnGo">▶ Kirim mutation</button>
    <div class="verdict" id="verdict">—</div>
    <table>
      <tr><th>Pengirim</th><th>Boleh?</th></tr>
      <tr><td>anonim</td><td class="no">✗ silakan login dulu</td></tr>
      <tr><td>Budi (ADMIN)</td><td class="yes">✓ ya — admin</td></tr>
      <tr><td>Ani (penulis)</td><td class="no">✗ bukan penulis post ini</td></tr>
      <tr><td>Citra</td><td class="no">✗ bukan penulis post ini</td></tr>
    </table>
  </div>
  <div class="col">
    <b>Log resolver DeletePost</b>
    <div class="log" id="log"><span class="info">Pilih pengirim lalu kirim mutation.</span></div>
    <div class="hint">Semua keputusan memakai data dari DATABASE (role &amp; author post) — tidak ada klaim yang dipercaya dari klien. Header hanyalah simulasi token; produksi memakai JWT (Bab 6).</div>
  </div>
</div>
<script>
  document.getElementById('btnGo').onclick = function () {
    var uid = document.getElementById('user').value;
    var logEl = document.getElementById('log');
    logEl.innerHTML = '';
    function log(msg, cls) {
      logEl.innerHTML += '\\n' + (cls ? '<span class="' + cls + '">' + msg + '</span>' : msg);
      logEl.scrollTop = logEl.scrollHeight;
    }
    var v = document.getElementById('verdict');

    log('POST /graphql  mutation { deletePost(id: 2) }', 'info');
    setTimeout(function () {
      // Middleware
      if (uid === '0') {
        log('authMiddleware: tanpa header → context anonim (currentUser=nil)');
      } else if (uid === '99') {
        log('authMiddleware: db.First(user, 99) → ErrRecordNotFound → tetap anonim');
      } else {
        log('authMiddleware: verifikasi X-User-ID:' + uid + ' → currentUser disuntikkan ke context', 'info');
      }
      setTimeout(function () {
        // Resolver
        log('resolver DeletePost: First(post, 2) → author_id=1 (Budi)');
        setTimeout(function () {
          if (uid === '0' || uid === '99') {
            log('✗ "silakan login dulu (set header X-User-ID)"', 'bad');
            v.className = 'verdict bad';
            v.textContent = '✗ DITOLAK — 401 Unauthorized (resolver berhenti di sini)';
            return;
          }
          if (uid === '1') {
            log('currentUser.Role == "ADMIN" → otorisasi lolos', 'info');
            setTimeout(function () {
              log('GORM ▸ DELETE FROM posts WHERE id = 2', 'info');
              setTimeout(function () {
                log('✓ data: { "deletePost": true }', 'ok');
                v.className = 'verdict ok';
                v.textContent = '✓ DIIZINKAN — post terhapus (Budi = admin)';
              }, 450);
            }, 350);
            return;
          }
          if (uid === '2') {
            log('currentUser.ID (2) != post.Author.ID (1) → bukan penulis', 'info');
          } else {
            log('currentUser.ID (3) != post.Author.ID (1) → bukan penulis', 'info');
          }
          setTimeout(function () {
            log('Role != "ADMIN" → tolak', 'bad');
            log('✗ "hanya penulis atau admin yang boleh menghapus post ini"', 'bad');
            v.className = 'verdict bad';
            v.textContent = '✗ DITOLAK — 403 Forbidden (sudah login, tapi tak berhak)';
          }, 400);
        }, 400);
      }, 450);
    }, 350);
  };
</script>
</body>
</html>`,
      hint: 'Jalankan kelima pilihan pengirim dan cocokkan dengan tabel di kiri. Anonim dan id 99 berhenti sebagai "belum login" (401); Ani dan Citra ditolak sebagai "tak berhak" (403); hanya Budi (admin) yang berhasil menghapus. Perhatikan jalur log resolver berbeda untuk tiap kategori.'
    },
    {
      type: 'example',
      title: 'Menguji keempat skenario dengan cURL',
      lang: 'bash',
      output: false,
      code: `# 1. Tanpa login → ditolak
curl -s http://localhost:4000/graphql -H "Content-Type: application/json" \\
  -d '{"query":"mutation { deletePost(id: 4) }"}'

# 2. Citra (penulis post 4) → boleh — DELETE sukses
curl -s http://localhost:4000/graphql -H "Content-Type: application/json" \\
  -H "X-User-ID: 3" -d '{"query":"mutation { deletePost(id: 4) }"}'

# 3. Ani (bukan penulis, role USER) → ditolak
curl -s http://localhost:4000/graphql -H "Content-Type: application/json" \\
  -H "X-User-ID: 2" -d '{"query":"mutation { deletePost(id: 1) }"}'

# 4. Budi (ADMIN) → boleh menghapus post siapa pun
curl -s http://localhost:4000/graphql -H "Content-Type: application/json" \\
  -H "X-User-ID: 1" -d '{"query":"mutation { deletePost(id: 3) }"}'`,
      explain: [
        'Jalankan berurutan setelah seed — post 4 milik Citra, post 1 milik Budi, post 3 milik Ani. Perhatikan perbedaan pesan error antara skenario 1 (belum login) dan 3 (tak berhak).',
        'Pada skenario cURL, header <code>X-User-ID</code> hanya menempel pada permintaan itu saja — inilah sifat stateless HTTP yang membuat setiap request wajib membawa identitasnya sendiri.'
      ]
    },
    {
      type: 'tip',
      title: 'Pindah ke JWT sungguhan: hanya middleware yang berubah',
      text: 'Karena resolver hanya mengenal <code>CurrentUserFrom(ctx)</code>, mengganti simulasi header menjadi JWT nyata berarti mengubah <b>satu fungsi</b> (<code>AuthenticateFromHeader</code> → verifikasi <code>Bearer</code> token dengan library seperti <code>golang-jwt/jwt</code>) tanpa menyentuh resolver. Inilah keuntungan memisah autentikasi di middleware — materi Bab 12 (JWT) bisa langsung dipasang di titik ini.'
    },
    {
      type: 'warn',
      title: 'Header X-User-ID bisa dipalsukan siapa pun',
      text: 'Selama belajar, siapa pun bisa mengirim <code>X-User-ID: 1</code> dan menjadi "Budi". Jangan pernah memakai pola ini di jaringan publik. Di produksi, identitas datang dari <b>token yang ditandatangani</b> (JWT), diverifikasi middleware, dan role dibaca dari database/tokernya — bukan dari angka mentah di header.'
    },
    {
      type: 'vocab',
      items: [
        ['context.Context', 'Antarmuka Go untuk membawa nilai lintas batas goroutine — di sini membawa pengguna login selama satu request.'],
        ['ctxKey', 'Tipe kunci context kustom (type ctxKey int) — idiom mencegah tabrakan kunci antar package.'],
        ['Type assertion', 'Ekspresi v.(T) untuk mengekstrak nilai context dengan tipe tertentu; menghasilkan (nilai, ok).'],
        ['Middleware HTTP', 'Lapisan membungkus handler (authMiddleware) yang berjalan sebelum server GQLGen — tempat verifikasi token sekali per request.'],
        ['Autentikasi vs otorisasi', 'Autentikasi = "siapa kamu" (login); otorisasi = "bolehkah kamu" (hak akses). Urutan keduanya tetap: kenali dulu, baru izinkan.'],
        ['401 vs 403', '401 = belum/tidak berhasil login; 403 = sudah login tetapi tidak berhak. Resolver membedakannya lewat dua pesan error terpisah.'],
        ['Field-level authorization', 'Pemeriksaan hak pada satu field/operasi (deletePost) di dalam resolver — bukan di middleware yang hanya melihat URL.'],
        ['r.WithContext', 'Method http.Request yang menghasilkan salinan request dengan context baru — jalur resmi menyuntikkan context dari middleware.']
      ]
    }
  ],
  recap: [
    'HTTP stateless → identitas pengguna dibawa per-request melalui <b>context.Context</b>.',
    'Tiga helper di <code>graph/context.go</code>: <code>WithCurrentUser</code> (menyuntik), <code>CurrentUserFrom</code> (membaca), <code>AuthenticateFromHeader</code> (verifikasi header → database).',
    'Kunci context memakai <b>tipe kustom</b> (<code>ctxKey int</code>) — idiom anti-tabrakan kunci di Go.',
    '<b>authMiddleware</b> di main.go memverifikasi sekali per request lalu menyuntikkan pengguna — pola setara buildContext Apollo Server.',
    'deletePost menerapkan otorisasi berlapis: cek login → cek kepemilikan/role dari database → hapus.',
    'Peran diganti JWT nyata hanya dengan mengubah middleware — resolver tetap utuh berkat <code>CurrentUserFrom(ctx)</code>.'
  ]
});
