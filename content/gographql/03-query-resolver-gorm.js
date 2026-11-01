/* ============================================================
   Contoh Project GraphQL (Go) — Bab 3: Resolver Query & GORM
   ============================================================ */
'use strict';

window.GOGRAPHQL_LESSONS = window.GOGRAPHQL_LESSONS || [];

window.GOGRAPHQL_LESSONS.push({
  id: 'gographql-query-resolver',
  title: 'Resolver Query & Membaca Data dengan GORM',
  chapter: 'Proyek Blog GraphQL Go',
  duration: '25 menit',
  intro: [
    'Skema GraphQL menyatakan <b>apa</b> yang bisa diminta klien; resolver menentukan <b>bagaimana</b> permintaan itu dijawab. Pada bab ini kita mengisi Query resolver proyek blog: <code>posts</code>, <code>post</code>, <code>users</code>, dan <code>postCount</code> — semuanya membaca MariaDB lewat GORM.',
    'Dua konsep GORM menjadi bintang bab ini: <b>Preload</b> (memuat relasi dalam sekali tambang) dan <b>Where</b> (filter). Kita juga membongkar <b>N+1 problem</b> — jebakan performa paling klasik pada API berelasi — beserta ilustrasi query-nya, sehingga kamu bisa mengenalinya di proyek mana pun.'
  ],
  objectives: [
    'Memahami cara GQLGen memanggil resolver Query dan bagaimana struct Resolver menjadi wadah dependency (DB)',
    'Mengimplementasikan resolver posts, post, users, dan postCount dengan GORM',
    'Memakai Preload untuk memuat relasi Author/Posts dalam satu putaran database',
    'Mengenali dan menghitung N+1 problem, lalu menyelesaikannya dengan Preload',
    'Menangani kasus "tidak ditemukan" sesuai kontrak skema (null vs error)'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Peran Resolver: Jembatan Skema → Database</h3><p>Setiap field pada tipe <code>Query</code> di skema wajib punya resolver — fungsi Go yang mengembalikan nilainya. GQLGen membuat <b>interface</b> berisi tanda tangan lengkap, dan kamu mengisinya di <code>graph/schema.resolvers.go</code>. Semua resolver menerima <code>ctx</code> (untuk membaca pengguna login dan pembatalan request) dan bermetode pada struct <code>Resolver</code> yang menjadi wadah seluruh dependency:</p>'
    },
    {
      type: 'example',
      title: 'graph/resolver.go — wadah dependency seluruh resolver',
      lang: 'go',
      output: false,
      code: `package graph

import "gorm.io/gorm"

// Resolver adalah wadah dependency untuk semua resolver.
// Satu instance dibuat sekali di main.go, dipakai seluruh request.
type Resolver struct {
	DB *gorm.DB
}`,
      explain: [
        'Pola ini setara dengan <b>context Apollo Server</b> di materi GraphQL Node: database disuntikkan sekali lalu tersedia di semua resolver. Bedanya, di Go tidak ada "context object" bebas — dependensi ditaruh pada struct Resolver, sementara <code>context.Context</code> dipakai khusus untuk data per-request (pengguna login, batas waktu).',
        '<code>*gorm.DB</code> aman dipakai bersama oleh banyak goroutine (satu request = satu goroutine di Go) — GORM mengelola connection pool di belakang layar.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Empat Resolver Query Proyek Kita</h3><p>Berikut implementasi lengkapnya. Perhatikan tiga kebiasaan baik yang konsisten: <b>(1)</b> <code>r.DB.WithContext(ctx)</code> agar query ikut batal bila klien memutus koneksi; <b>(2)</b> <code>Preload("Author")</code> untuk memuat relasi; <b>(3)</b> pesan error generik untuk klien — detail database dicatat server, bukan dibocorkan.</p>'
    },
    {
      type: 'example',
      title: 'graph/schema.resolvers.go — seluruh Query resolver',
      lang: 'go',
      output: false,
      code: `// Posts: daftar post, filter opsional published, terbaru di atas.
func (r *queryResolver) Posts(ctx context.Context, published *bool) ([]*model.Post, error) {
	var posts []*model.Post
	q := r.DB.WithContext(ctx).Preload("Author").Order("created_at DESC, id DESC")
	if published != nil {
		q = q.Where("published = ?", *published)
	}
	if err := q.Find(&posts).Error; err != nil {
		return nil, errors.New("gagal membaca posts")
	}
	return posts, nil
}

// Post: satu baris berdasarkan id — null (bukan error) bila tidak ada.
func (r *queryResolver) Post(ctx context.Context, id int) (*model.Post, error) {
	var post model.Post
	if err := r.DB.WithContext(ctx).Preload("Author").First(&post, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // skema: post = Post (nullable)
		}
		return nil, errors.New("gagal membaca database")
	}
	return &post, nil
}

// Users: semua pengguna beserta postnya (satu Preload, bukan loop).
func (r *queryResolver) Users(ctx context.Context) ([]*model.User, error) {
	var users []*model.User
	if err := r.DB.WithContext(ctx).Preload("Posts").Find(&users).Error; err != nil {
		return nil, errors.New("gagal membaca users")
	}
	return users, nil
}

// PostCount: jumlah total post untuk indikator dashboard.
func (r *queryResolver) PostCount(ctx context.Context) (int, error) {
	var count int64
	if err := r.DB.WithContext(ctx).Model(&model.Post{}).Count(&count).Error; err != nil {
		return 0, errors.New("gagal menghitung post")
	}
	return int(count), nil
}`,
      explain: [
        '<code>published *bool</code> — pointer menandai argument <b>opsional</b>: <code>*bool</code> = nil bila klien tidak mengirim, false bila mengirim <code>false</code>, true bila <code>true</code>. GQLGen membuat pemetaan ini otomatis dari <code>published: Boolean</code> (tanpa <code>!</code>) di skema.',
        'Perhatikan dua jalur error yang berbeda pada <code>Post</code>: <b>record tidak ada → return nil, nil</b> (sesuai kontrak skema nullable), sedangkan <b>galat database → return error</b>. Menukar keduanya membuat klien salah menafsirkan respons.',
        '<code>First</code> mengambil satu baris (LIMIT 1, urut primary key), <code>Find</code> mengambil banyak baris, dan <code>Count</code> menghasilkan <code>SELECT COUNT(*)</code>. Ketiganya adalah "verb" pembacaan GORM yang paling sering dipakai.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Preload: Memuat Relasi dalam Satu Putaran</h3><p>Karena skema menyatakan <code>posts { author { name } }</code>, resolver posts harus mengisi field <code>Author</code> tiap post. Tanpa <code>Preload</code>, field itu tetap nil — dan karena skema menjamin <code>author: User!</code> non-null, GQLGen akan mengembalikan error runtime. Preload menyelesaikannya dengan satu query tambahan untuk seluruh halaman data:</p>'
    },
    {
      type: 'example',
      title: 'SQL yang dihasilkan GORM untuk query posts + author',
      lang: 'sql',
      output: false,
      code: `-- Langkah 1: resolver Posts() → utama
SELECT * FROM posts ORDER BY created_at DESC, id DESC;

-- Langkah 2: GORM memuat relasi Author untuk SELURUH hasil langkah 1
SELECT * FROM users WHERE id IN (1, 1, 2, 3);`,
      explain: [
        'Dua query, berapa pun jumlah post. GORM mengumpulkan seluruh <code>author_id</code> hasil langkah 1 lalu meminta user dengan <code>IN (...)</code> — inilah inti teknik <b>batch loading</b> yang juga menjadi dasar DataLoader pada materi GraphQL Node.',
        'Preload diletakkan berantai sesuai kebutuhan: <code>Preload("Author")</code> di resolver posts, <code>Preload("Posts")</code> di resolver users.'
      ]
    },
    {
      type: 'text',
      html: '<h3>N+1 Problem: Musuh Performa API Berelasi</h3><p>Bayangkan resolver posts tidak memakai Preload, melainkan memanggil resolver field <code>Author</code> per post. Dengan 20 post, database menerima <b>1 query utama + 20 query turunan</b>. Simulasinya bisa kamu jalankan di bawah — amati perbedaan jumlah query dan waktu eksekusi.'
    },
    {
      type: 'live',
      title: 'Simulasi: N+1 vs Preload (hitung query-nya!)',
      lang: 'html',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: system-ui, sans-serif; font-size: 13px; margin: 12px; background: #f8fafc; color: #0f172a; }
  h3 { margin: 0 0 8px; font-size: 14px; }
  .wrap { display: flex; gap: 14px; flex-wrap: wrap; }
  .col { flex: 1; min-width: 250px; }
  .ctl { margin: 6px 0; display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
  select, input[type=range] { padding: 6px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px; }
  button { padding: 8px 14px; border: 0; border-radius: 6px; font-weight: 700; cursor: pointer; color: #fff; background: #E10098; }
  button:disabled { background: #94a3b8; cursor: wait; }
  .log { background: #0f172a; color: #94a3b8; border-radius: 6px; padding: 8px; min-height: 190px; max-height: 230px;
         overflow-y: auto; font-family: monospace; font-size: 11px; white-space: pre-wrap; }
  .log .ok { color: #4ade80; } .log .info { color: #7dd3fc; } .log .bad { color: #f87171; }
  .stat { display: flex; gap: 10px; margin-top: 8px; }
  .stat div { flex: 1; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; text-align: center; }
  .stat b { display: block; font-size: 20px; color: #0f172a; }
  .stat span { font-size: 10px; color: #64748b; }
  .hint { font-size: 11px; color: #64748b; margin-top: 6px; }
</style>
</head>
<body>
<h3>⚡ Berapa query database untuk 1 halaman posts + author?</h3>
<div class="ctl">
  <label>Jumlah post:</label>
  <input type="range" id="n" min="5" max="50" step="5" value="20">
  <b id="nv">20</b>
</div>
<div class="ctl">
  <label>Cara memuat author:</label>
  <select id="mode">
    <option value="nplus1">✗ Tanpa Preload — resolver Author per post (N+1)</option>
    <option value="preload">✓ Preload("Author") — batch loading</option>
  </select>
</div>
<div class="ctl"><button id="btnGo">▶ Jalankan resolver</button></div>
<div class="stat">
  <div><b id="qc">-</b><span>JUMLAH QUERY</span></div>
  <div><b id="ms">-</b><span>PERKIRAAN WAKTU (ms)</span></div>
</div>
<div class="log" id="log"><span class="info">Pilih mode lalu tekan jalankan.</span></div>
<div class="hint">Aturan cepat: bila log menunjukkan satu query PER baris data — itulah N+1.</div>
<script>
  document.getElementById('n').oninput = function () {
    document.getElementById('nv').textContent = this.value;
  };
  function log(msg, cls) {
    var el = document.getElementById('log');
    el.innerHTML += '\\n' + (cls ? '<span class="' + cls + '">' + msg + '</span>' : msg);
    el.scrollTop = el.scrollHeight;
  }
  document.getElementById('btnGo').onclick = function () {
    var btn = this; btn.disabled = true;
    var n = Number(document.getElementById('n').value);
    var mode = document.getElementById('mode').value;
    var logEl = document.getElementById('log');
    logEl.innerHTML = '';
    var queries = 0, i = 0;

    log('resolver Posts() dipanggil GQLGen', 'info');
    setTimeout(function () {
      queries++;
      log('① SELECT * FROM posts ORDER BY created_at DESC  (menghasilkan ' + n + ' baris)', 'info');

      function finish() {
        document.getElementById('qc').textContent = queries;
        document.getElementById('ms').textContent = (queries * 1.5).toFixed(1);
        if (mode === 'nplus1') {
          log('✗ ' + queries + ' QUERY untuk ' + n + ' post — N+1 PROBLEM', 'bad');
          log('  Di produksi dengan 500 post: 501 query setiap request!', 'bad');
        } else {
          log('✓ ' + queries + ' QUERY total — berapa pun jumlah post', 'ok');
          log('  Inilah yang ditulis di schema.resolvers.go: Preload("Author").', 'ok');
        }
        btn.disabled = false;
      }

      if (mode === 'nplus1') {
        var perItem = function () {
          if (i >= n) { finish(); return; }
          i++;
          queries++;
          log('  ②' + i + ' SELECT * FROM users WHERE id = ...  (author post ke-' + i + ')');
          setTimeout(perItem, 60);
        };
        setTimeout(perItem, 300);
      } else {
        setTimeout(function () {
          queries++;
          log('② SELECT * FROM users WHERE id IN (...)  (seluruh author sekaligus)', 'info');
          finish();
        }, 350);
      }
    }, 300);
  };
</script>
</body>
</html>`,
      hint: 'Jalankan dengan mode N+1 pada 20 post, lalu ulangi dengan Preload. Naikkan slider ke 50 dan jalankan lagi — query mode N+1 ikut naik, sedangkan Preload tetap 2. Inilah alasan DataLoader (materi Node) dan Preload (Go) wajib pada API berelasi.'
    },
    {
      type: 'example',
      title: 'Menguji keempat query di Playground',
      lang: 'graphql',
      output: false,
      code: `# Semua post + penulis (terbaru di atas)
{ posts { id title published author { name role } } }

# Hanya post terbit
{ posts(published: true) { id title } }

# Detail satu post — id 999 tidak ada → data: { "post": null } (bukan error)
{ post(id: 1) { id title author { email } } }

# Pengguna + jumlah post masing-masing
{ users { id name posts { id } } postCount }`,
      explain: [
        'Coba <code>post(id: 999)</code> — responsnya <code>{"data":{"post":null}}</code>. Inilah kontrak nullable yang kita jaga di resolver: tidak ada bukanlah kesalahan server.',
        'Bandingkan <code>posts</code> tanpa argument dan <code>posts(published: true)</code> — argument opsional membuat satu endpoint melayani dua kebutuhan klien tanpa mengorbankan kontrak.'
      ]
    },
    {
      type: 'tip',
      title: 'Aktifkan DEBUG=1 untuk melihat query hidup',
      text: 'Jalankan server dengan <code>DEBUG=1 go run .</code> lalu jalankan query di Playground — setiap SQL dari GORM tampil di terminal, lengkap dengan waktu eksekusinya. Ini cara tercepat memverifikasi bahwa Preload bekerja dan menangkap N+1 sejak dini.'
    },
    {
      type: 'warn',
      title: 'Jangan mengembalikan pesan error database ke klien',
      text: 'Pesan seperti <code>Error 1054: Unknown column ...</code> membocorkan struktur tabelmu. Resolver di proyek ini membalas dengan pesan generik ("gagal membaca posts") dan membiarkan server mencatat detailnya. Pola ini dilanjutkan serius di bab produksi.'
    },
    {
      type: 'vocab',
      items: [
        ['Resolver', 'Fungsi Go yang mewujudkan satu field skema — jembatan antara kontrak GraphQL dan sumber data.'],
        ['struct Resolver', 'Wadah dependency seluruh resolver (berisi *gorm.DB); dibuat sekali di main.go, dipakai semua request.'],
        ['Preload', 'Method GORM yang memuat relasi dalam query terpisah namun ter-batch (WHERE id IN ...) — solusi N+1 di Go.'],
        ['N+1 problem', 'Pola anti: 1 query utama lalu 1 query turunan per baris — jumlah query linear terhadap data.'],
        ['Pointer argument', '*bool pada argument resolver menandai argument opsional hasil pemetaan dari skema tanpa tanda !.'],
        ['ErrRecordNotFound', 'Nilai error khas GORM saat First tidak menemukan baris — dibedakan dari galat database sungguhan.'],
        ['Batch loading', 'Teknik mengumpulkan seluruh kunci relasi lalu memuatnya sekali dengan IN (...); dasar kerja Preload & DataLoader.'],
        ['WithContext', 'Method GORM yang membawa context.Context — query ikut batal bila klien memutus koneksi atau batas waktu terlampaui.']
      ]
    }
  ],
  recap: [
    'Seluruh dependency resolver diletakkan pada <code>struct Resolver</code> (<code>graph/resolver.go</code>) — pola setara context Apollo di Node.',
    'Empat Query resolver: <code>posts</code> (dengan filter opsional), <code>post</code> (nullable), <code>users</code> (dengan relasi), <code>postCount</code>.',
    'Argument opsional di Go berbentuk pointer (<code>*bool</code>) — nil berarti "tidak dikirim".',
    '<b>Preload</b> memuat relasi dalam satu query tambahan ter-batch; tanpanya field non-null di skema bisa memicu error runtime.',
    '<b>N+1 problem</b>: satu query per baris data. Deteksi dengan <code>DEBUG=1</code>, atasi dengan Preload (setara DataLoader).',
    'Kontrak skema dijaga: tidak ditemukan → <code>null</code>, galat database → error dengan pesan generik tanpa membocorkan detail internal.'
  ]
});
