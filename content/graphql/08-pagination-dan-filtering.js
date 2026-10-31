/* ============================================================
   GraphQL — Bab 8: Pagination, Filtering & Sorting
   ============================================================ */
'use strict';

window.GRAPHQL_LESSONS = window.GRAPHQL_LESSONS || [];

window.GRAPHQL_LESSONS.push({
  id: 'pagination-dan-filtering',
  title: 'Pagination, Filtering & Sorting: Menyaring Data dalam Skala Besar',
  chapter: 'Membangun GraphQL Server',
  duration: '18 menit',
  intro: [
    'Bayangkan aplikasi toko onlinemu sudah punya 1 juta produk. Jika resolver <code>products</code> mengembalikan semuanya dalam satu query, server akan kehabisan memori dan klien menunggu sangat lama. Di REST, masalah ini dipecahkan dengan query string seperti <code>?page=2&amp;limit=20</code>. GraphQL menyelesaikannya dengan cara yang lebih terstruktur: <b>argument pada field</b>.',
    'Dalam pelajaran ini kamu akan membangun tiga kemampuan inti hampir setiap aplikasi nyata: <b>pagination</b> (ambil data per halaman), <b>filtering</b> (saring data sesuai kriteria), dan <b>sorting</b> (urutkan data) — lengkap dengan pola <i>cursor-based pagination</i> yang direkomendasikan untuk data yang terus berubah.'
  ],
  objectives: [
    'Menerapkan offset-based pagination (limit &amp; skip) pada resolver GraphQL',
    'Membuat input type untuk filtering dan menerapkannya lewat argument',
    'Mengurutkan data dengan argument orderBy bertipe enum',
    'Memahami kelemahan offset pagination dan kapan beralih ke cursor-based pagination',
    'Menulis pola Relay-style Connection (edges, node, pageInfo) pada schema SDL'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Argument Field = Query String-nya GraphQL</h3><p>Di REST, parameter disimpan di URL (<code>/products?page=2</code>). Di GraphQL, parameter adalah <b>argument yang menempel pada field</b>. Karena itu pagination, filtering, dan sorting tidak membutuhkan endpoint baru — cukup argument baru di field yang sama.</p><table><thead><tr><th>Kebutuhan</th><th>REST</th><th>GraphQL</th></tr></thead><tbody><tr><td>Pagination</td><td><code>?page=2&amp;limit=20</code></td><td><code>products(page: 2, limit: 20)</code></td></tr><tr><td>Filtering</td><td>?category=sepatu&amp;minPrice=100</td><td><code>products(category: "sepatu", minPrice: 100)</code></td></tr><tr><td>Sorting</td><td>?sort=-createdAt</td><td><code>products(orderBy: NEWEST)</code></td></tr></tbody></table><p>Keunggulan utamanya: argument GraphQL <b>ter-tipe</b>. Jika kamu salah ketik tipe data, server menolaknya sebelum resolver berjalan — bukan menghasilkan error 500 misterius.</p>'
    },
    {
      type: 'example',
      title: 'Offset-Based Pagination: limit, skip, dan total',
      lang: 'graphql',
      output: false,
      code: `# --- Schema SDL: argument pada field Query ---

type Query {
  # Ambil 10 produk mulai dari baris ke-20 (halaman ke-3 jika limit 10)
  products(limit: Int = 10, skip: Int = 0): [Product!]!

  # Pagination + filtering + sorting dalam SATU field
  posts(
    limit: Int = 5
    skip: Int = 0
    status: PostStatus
    authorId: ID
    orderBy: PostOrder = NEWEST
  ): [Post!]!

  # Menghitung total data (penting untuk membuat indikator halaman)
  productsCount(category: String): Int!
}

enum PostOrder {
  NEWEST
  OLDEST
  TITLE_ASC
}

type Product {
  id: ID!
  name: String!
  price: Int!
  category: String!
}

# --- Contoh pemakaian dari klien ---

query HalamanTiga {
  products(limit: 10, skip: 20) {
    id
    name
    price
  }
  productsCount
}`,
      explain: [
        '<code>limit</code> dan <code>skip</code> adalah pola paling sederhana: <code>skip: 20, limit: 10</code> berarti "lewati 20 baris pertama, ambil 10 berikutnya" — setara halaman 3.',
        'Default value (<code>= 10</code>) membuat argument opsional — klien yang tidak mengirimnya tetap mendapat 10 data, bukan error.',
        'Field terpisah seperti <code>productsCount</code> dibutuhkan agar UI bisa menampilkan "Halaman 3 dari 47" dan menentukan apakah masih ada halaman berikutnya.'
      ]
    },
    {
      type: 'example',
      title: 'Resolver dengan Prisma: findMany({ take, skip, where, orderBy })',
      lang: 'javascript',
      output: false,
      code: `// src/resolvers.ts — resolver Query dengan pagination, filter & sort
const resolvers = {
  Query: {
    products: async (_parent, args, { prisma }) => {
      const { limit = 10, skip = 0, category, minPrice } = args;

      // Susun objek "where" hanya dari filter yang dikirim klien
      const where = {};
      if (category) where.category = category;
      if (minPrice != null) where.price = { gte: minPrice };

      return prisma.product.findMany({
        take: limit,      // = LIMIT di SQL
        skip,             // = OFFSET di SQL
        where,            // = WHERE di SQL
        orderBy: { createdAt: 'desc' }  // = ORDER BY di SQL
      });
    },

    productsCount: async (_parent, { category }, { prisma }) => {
      return prisma.product.count({
        where: category ? { category } : undefined
      });
    }
  }
};`,
      explain: [
        'Pemetaannya persis dengan SQL: <code>take</code> → LIMIT, <code>skip</code> → OFFSET, <code>where</code> → WHERE, <code>orderBy</code> → ORDER BY. Kamu tidak perlu menulis SQL mentah.',
        'Objek <code>where</code> dibangun bertahap (conditional) agar filter yang tidak dikirim klien tidak ikut membatasi hasil — pola ini sangat umum pada resolver nyata.',
        'Perhatikan dua query terpisah (findMany + count). Agar efisien, keduanya bisa dijalankan berdampingan dengan <code>Promise.all</code>.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Filtering dengan Input Type</h3><p>Untuk filter yang kompleks (banyak kriteria sekaligus), menumpuk argument satu per satu membuat signature field meledak. Solusinya: kelompokkan dalam satu <b>input type</b> — konsep yang sudah kamu pelajari di pelajaran SDL.</p><blockquote style="border-left:3px solid var(--accent);padding-left:12px;margin:12px 0"><b>Aturan praktis:</b> gunakan argument terpisah jika filternya 1–3 dan sederhana; gunakan input type jika kriterianya banyak, bertingkat, atau opsional sebagian besar.</blockquote>'
    },
    {
      type: 'example',
      title: 'Input Type untuk Filter Gabungan (ProductFilter)',
      lang: 'graphql',
      output: false,
      code: `input ProductFilter {
  keyword: String          # cari di nama (LIKE '%...%')
  category: String
  minPrice: Int
  maxPrice: Int
  inStock: Boolean
}

type Query {
  products(filter: ProductFilter, limit: Int = 20, skip: Int = 0): [Product!]!
}

# Klien mengirim hanya field yang ingin dipakai:
query CariSepatu {
  products(
    filter: { keyword: "sepatu", minPrice: 100000, inStock: true }
    limit: 5
  ) {
    id
    name
    price
  }
}`,
      explain: [
        'Input type memungkinkan klien mengirim <b>sebagian</b> field saja — field yang tidak diisi bernilai null dan boleh diabaikan resolver.',
        'Berbeda dengan <code>type</code> (untuk output), <code>input</code> tidak boleh punya default resolver atau method — semuanya hanya data masuk.',
        'Objek filter seperti ini mudah dipetakan 1:1 ke objek <code>where</code> Prisma, sehingga resolver tetap ramping.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Sorting dengan Enum</h3><p>Menggunakan string bebas untuk pengurutan (<code>orderBy: "harga_naik"</code>) berbahaya: typo tidak tertangkap dan resolver harus menerjemahkan banyak variasi string. GraphQL menawarkan cara yang lebih aman: <b>enum</b> — sekumpulan nilai tetap yang divalidasi server.</p>'
    },
    {
      type: 'example',
      title: 'Sorting Aman dengan Enum PostOrder',
      lang: 'graphql',
      output: false,
      code: `enum PostOrder {
  NEWEST      # createdAt DESC
  OLDEST      # createdAt ASC
  TITLE_ASC   # title ASC
  TITLE_DESC  # title DESC
}

type Query {
  posts(orderBy: PostOrder = NEWEST, limit: Int = 10): [Post!]!
}

# Resolver menerjemahkan enum → objek Prisma:
# orderBy: { NEWEST: { createdAt: "desc" },
#            TITLE_ASC: { title: "asc" } }`,
      explain: [
        'Klien hanya boleh memilih dari 4 nilai enum — <code>orderBy: "HARGA"</code> akan langsung ditolak dengan pesan error yang jelas, bukan diabaikan diam-diam.',
        'Default <code>= NEWEST</code> menjamin hasil selalu terurut walaupun klien lupa mengirim argument (mencegah data "loncat-loncat" antar request).',
        'Di resolver, petakan enum ke objek orderBy Prisma lewat lookup table — jangan gunakan string enum secara langsung sebagai property.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Batas Offset Pagination &amp; Solusinya: Cursor</h3><p>Offset pagination punya masalah serius pada data dinamis: saat sebuah produk baru ditambahkan di atas daftar, <b>seluruh isi halaman ikut bergeser</b> — klien bisa melihat data terlewat (double) atau terlewat dua kali. Masalah ini makin parah seiring banyaknya data; database harus membuang baris yang dilewati satu per satu.</p><p>Solusinya adalah <b>cursor-based pagination</b>: alih-alih menghitung posisi, klien menyimpan <i>penanda (cursor)</i> terakhir yang diterimanya, lalu server mengambil data setelah penanda itu. Pola standarnya disebut <b>Relay-style Connection</b>.</p><table><thead><tr><th>Aspek</th><th>Offset (limit/skip)</th><th>Cursor (Connection)</th></tr></thead><tbody><tr><td>Cocok untuk</td><td>Halaman statis, data jarang berubah</td><td>Feed tak berujung (infinite scroll), data sering berubah</td></tr><tr><td>Stabilitas data</td><td>Geser/terlewat saat data berubah</td><td>Stabil — berlabuh pada penanda</td></tr><tr><td>Performa banyak data</td><td>Makin lambat (skip besar)</td><td>Tetap cepat (pakai index)</td></tr><tr><td>Bisa lompat ke halaman N</td><td>Ya</td><td>Tidak (hanya lanjut/mundur)</td></tr></tbody></table>'
    },
    {
      type: 'example',
      title: 'Relay-Style Connection: edges, node, pageInfo',
      lang: 'graphql',
      output: false,
      code: `type Query {
  productsCursor(first: Int = 10, after: String): ProductConnection!
}

type ProductConnection {
  edges: [ProductEdge!]!   # pasangan node + cursor
  pageInfo: PageInfo!      # info navigasi halaman
  totalCount: Int!
}

type ProductEdge {
  cursor: String!          # penanda unik baris ini
  node: Product!           # data sebenarnya
}

type PageInfo {
  hasNextPage: Boolean!    # masih ada data berikutnya?
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String        # kirim balik sebagai "after" berikutnya
}

# Pemakaian dari klien (infinite scroll):
query MuatLagi {
  productsCursor(first: 5) {
    totalCount
    pageInfo { hasNextPage endCursor }
    edges {
      cursor
      node { id name price }
    }
  }
}`,
      explain: [
        'Klien tidak pernah tahu angka halaman — ia hanya meneruskan <code>endCursor</code> dari response sebelumnya sebagai <code>after</code> pada request berikutnya.',
        '<code>cursor</code> umumnya berupa encoding dari ID/createdAt baris tersebut, sehingga tetap valid walaupun baris lain ditambah atau dihapus.',
        'Struktur <code>edges → node</code> memang terasa berat, tapi ini standar Relay dan didukung otomatis oleh banyak tool (Apollo, GraphiQL, Relay).'
      ]
    },
    {
      type: 'example',
      title: 'Resolver Cursor dengan Prisma (berlabuh pada createdAt + id)',
      lang: 'javascript',
      output: false,
      code: `// src/resolvers.ts — cursor pagination
const resolvers = {
  Query: {
    productsCursor: async (_parent, { first = 10, after }, { prisma }) => {
      // Decode cursor: "timestamp_id" -> objek untuk "lebih besar dari"
      const decoded = after
        ? Buffer.from(after, 'base64').toString('utf8').split('_')
        : null;

      const rows = await prisma.product.findMany({
        take: first + 1,                        // ambil 1 ekstra untuk cek sisa
        ...(decoded && {
          cursor: { id: decoded[1] },           // berlabuh dari baris terakhir
          skip: 1,                              // lalu lewati baris itu sendiri
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
        }),
        ...(decoded === null && {
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
        })
      });

      const hasNextPage = rows.length > first;
      const items = hasNextPage ? rows.slice(0, first) : rows;

      return {
        edges: items.map(p => ({
          cursor: Buffer.from(p.createdAt + '_' + p.id).toString('base64'),
          node: p
        })),
        pageInfo: {
          hasNextPage,
          endCursor: items.length
            ? Buffer.from(
                items[items.length - 1].createdAt + '_' +
                items[items.length - 1].id
              ).toString('base64')
            : null
        },
        totalCount: await prisma.product.count()
      };
    }
  }
};`,
      explain: [
        'Trik <code>take: first + 1</code>: ambil satu baris ekstra hanya untuk mengetahui apakah masih ada data — jika ya, potong dan set <code>hasNextPage: true</code>.',
        'Urutan <code>orderBy</code> wajib deterministik (mis. createdAt + id) agar tidak ada baris yang terlewat ketika ada nilai createdAt yang sama persis.',
        'Cursor disimpan sebagai base64 agar klien tidak mengerti isinya (kontrak internal yang bisa berubah tanpa merusak klien lama).'
      ]
    },
    {
      type: 'live',
      title: 'Simulasi: Offset vs Cursor pada Data yang Berubah',
      lang: 'html',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: system-ui, sans-serif; font-size: 13px; margin: 12px; background: #f8fafc; color: #0f172a; }
  h3 { margin: 0 0 8px; font-size: 14px; }
  .row { display: flex; gap: 12px; flex-wrap: wrap; }
  .panel { flex: 1; min-width: 240px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; }
  .panel h4 { margin: 0 0 6px; font-size: 13px; }
  .list { border: 1px dashed #cbd5e1; border-radius: 6px; padding: 6px; min-height: 110px; background: #f8fafc; }
  .item { display: flex; justify-content: space-between; padding: 3px 6px; margin: 2px 0; border-radius: 4px; background: #fff; border: 1px solid #e2e8f0; font-size: 12px; }
  .item .new { color: #dc2626; font-weight: 700; }
  .item.shift { background: #fef3c7; border-color: #f59e0b; }
  .item.ok { background: #dcfce7; border-color: #22c55e; }
  button { padding: 6px 10px; border: 0; border-radius: 6px; font-weight: 700; cursor: pointer; color: #fff; margin: 4px 4px 4px 0; }
  .b1 { background: #2563eb; } .b2 { background: #16a34a; } .b3 { background: #9333ea; }
  .log { background: #0f172a; color: #94a3b8; padding: 8px; border-radius: 6px; min-height: 70px; font-family: monospace; font-size: 11px; white-space: pre-wrap; }
  .log .bad { color: #f87171; } .log .good { color: #4ade80; } .log .warn { color: #facc15; }
  .badge { display: inline-block; padding: 1px 8px; border-radius: 999px; font-weight: 700; font-size: 11px; background: #e2e8f0; }
</style>
</head>
<body>
<h3>📄 Offset vs Cursor — saat data baru datang di tengah jalan</h3>
<div class="row">
  <div class="panel">
    <h4>Daftar Produk (10 baris pertama)</h4>
    <div class="list" id="list"></div>
  </div>
  <div class="panel">
    <h4>Kendali</h4>
    <button class="b1" id="btnLoad">1. Muat Halaman 1 (limit 5)</button><br>
    <button class="b2" id="btnInsert">2. Sisipkan Produk Baru di ATAS</button><br>
    <button class="b3" id="btnNext">3. Muat Halaman 2 berikutnya</button>
    <div style="margin-top:8px" id="status"></div>
    <div class="log" id="log">Tekan tombol secara berurutan...</div>
  </div>
</div>
<script>
  var products = [];
  for (var i = 1; i <= 12; i++) {
    products.push({ id: i, name: 'Produk #' + i, flag: '' });
  }
  var page1 = null;   // { offset, ids } untuk mode offset
  var cursor = null;  // id terakhir untuk mode cursor
  var nextId = 13;

  function render(extra) {
    var el = document.getElementById('list');
    var html = '';
    products.slice(0, 5).forEach(function (p) {
      var cls = 'item';
      if (p.flag === 'new') cls += ' new-parent';
      html += '<div class="' + cls + '"><span' + (p.flag === 'new' ? ' class="new"' : '') + '>' +
        p.name + (p.flag === 'new' ? ' ★ BARU' : '') + '</span><span>#' + p.id + '</span></div>';
    });
    if (extra) html += extra;
    el.innerHTML = html;
  }

  function log(msg, cls) {
    var el = document.getElementById('log');
    el.innerHTML += '<span class="' + (cls || '') + '">' + msg + '</span>\\n';
    el.scrollTop = el.scrollHeight;
  }

  function setStatus(html) { document.getElementById('status').innerHTML = html; }

  document.getElementById('btnLoad').onclick = function () {
    page1 = { ids: products.slice(0, 5).map(function (p) { return p.id; }) };
    cursor = products[4].id; // cursor = id baris ke-5 (penanda terakhir)
    render();
    log('GET page=1 limit=5 -> ' + page1.ids.join(','), 'good');
    log('Cursor tersimpan: id=' + cursor);
    setStatus('Halaman 1 dimuat. Sekarang klik tombol hijau.');
  };

  document.getElementById('btnInsert').onclick = function () {
    products.unshift({ id: nextId++, name: 'Produk BARU', flag: 'new' });
    render();
    log('INSERT produk baru di posisi 1 (data bergeser ke bawah)', 'warn');
    setStatus('Data baru disisipkan! Klik tombol ungu.');
  };

  document.getElementById('btnNext').onclick = function () {
    // OFFSET: menghitung dari posisi ke-5 (skip:5)
    var offsetView = products.slice(5, 10).map(function (p) { return p.id; });
    var leaked = offsetView.filter(function (id) { return page1.ids.indexOf(id) !== -1; });

    // CURSOR: mengambil setelah baris id=cursor
    var idx = products.findIndex(function (p) { return p.id === cursor; });
    var cursorView = products.slice(idx + 1, idx + 6).map(function (p) { return p.id; });
    var dupCursor = cursorView.filter(function (id) { return page1.ids.indexOf(id) !== -1; });

    log('OFFSET  page=2 skip:5 -> [' + offsetView.join(',') + ']',
      leaked.length ? 'bad' : 'good');
    if (leaked.length) log('  !! Produk ' + leaked.join(',') + ' KEMBANALI muncul (duplikat)', 'bad');
    log('CURSOR  after=' + cursor + ' -> [' + cursorView.join(',') + ']',
      dupCursor.length ? 'bad' : 'good');
    log(dupCursor.length ? '  duplikat juga' : '  TANPA duplikat — tidak ada data terlewat', 'good');

    setStatus(
      '<span class="badge" style="background:#fee2e2">Offset: ' +
      (leaked.length ? leaked.length + ' duplikat' : 'bersih') + '</span> ' +
      '<span class="badge" style="background:#dcfce7">Cursor: ' +
      (dupCursor.length ? dupCursor.length + ' duplikat' : 'bersih') + '</span>'
    );
  };

  render();
</script>
</body>
</html>`,
      hint: 'Ikuti 3 langkah berurutan. Setelah produk baru disisipkan, bandingkan hasil halaman 2: offset mengulang data (duplikat), sedangkan cursor tetap lanjut tepat setelah baris terakhir yang kamu terima.'
    },
    {
      type: 'tip',
      title: 'Kapan memakai offset vs cursor?',
      text: '<b>Gunakan offset (limit/skip)</b> untuk: panel admin, hasil pencarian dengan nomor halaman, atau data yang jarang berubah — penggunanya butuh lompat ke "Halaman 7".<br><br><b>Gunakan cursor (Connection)</b> untuk: feed media sosial, notifikasi, log aktivitas, infinite scroll — di mana data terus bertambah dan duplikat/terlewat sangat mengganggu.<br><br>Untuk proyek portofolio (blog/toko), offset sudah lebih dari cukup; pelajari cursor ketika kamu mulai membangun feed.'
    },
    {
      type: 'warn',
      title: 'Jangan lewatkan productsCount dan orderBy deterministik',
      text: 'Tanpa field penghitung (<code>count</code>), UI tidak bisa menampilkan total halaman atau menentukan "sudah habis atau belum" selain dari <code>hasNextPage</code>. Selain itu, selalu urutkan dengan <b>minimal dua kunci</b> (mis. <code>createdAt</code> + <code>id</code>) — jika banyak baris punya nilai createdAt sama persis, urutan tanpa kunci kedua bisa tiba-tiba melompat dan membuat data terlewat walau pagination-nya sudah benar.'
    },
    {
      type: 'vocab',
      items: [
        ['Offset-Based Pagination', 'Pola pagination dengan menghitung baris yang dilewati (skip/offset) lalu mengambil sejumlah baris (limit). Mudah, tapi data bisa bergeser saat tabel berubah.'],
        ['Cursor-Based Pagination', 'Pola pagination yang berlabuh pada penanda (cursor) baris terakhir — data tidak pernah terlewat atau terduplikat walau ada penambahan data.'],
        ['Connection (Relay)', 'Struktur standar GraphQL untuk hasil berpaginasi: berisi edges (pasangan cursor + node), pageInfo, dan totalCount.'],
        ['Edge', 'Satu baris dalam Connection — memuat node (data asli) dan cursor (penanda posisinya).'],
        ['PageInfo', 'Objek berisi hasNextPage, hasPreviousPage, startCursor, endCursor — navigasi untuk infinite scroll.'],
        ['Filtering', 'Menyaring data berdasarkan kriteria tertentu (kategori, rentang harga, kata kunci) lewat argument query.'],
        ['Sorting', 'Mengurutkan hasil data (mis. terbaru, termurah) lewat argument orderBy, biasanya bertipe enum agar aman dari salah ketik.']
      ]
    }
  ],
  recap: [
    'Pagination, filtering, dan sorting di GraphQL hanyalah <b>argument pada field</b> — tidak perlu endpoint baru seperti REST.',
    'Offset pagination (<code>limit</code> + <code>skip</code>) paling sederhana dan cocok untuk data statis; selalu pasangkan dengan field <b>count</b> agar UI tahu total halaman.',
    'Filter kompleks sebaiknya dikelompokkan dalam <b>input type</b>, sementara pilihan pengurutan memakai <b>enum</b> agar ter-validasi server.',
    'Offset pagination membuat data <b>geser/terduplikat</b> saat ada penambahan data — untuk kasus ini gunakan <b>cursor-based pagination</b> (Relay Connection).',
    'Pola Connection (<code>edges</code>, <code>node</code>, <code>pageInfo</code>) menjadi standar industri untuk infinite scroll, dengan cursor deterministik (createdAt + id).'
  ]
});
