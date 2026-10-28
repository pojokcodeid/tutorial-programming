/* ============================================================
   Pelajaran HTTP — Bab 16: Desain API dan Perilaku Lanjutan
   ============================================================ */
'use strict';

window.HTTP_LESSONS = window.HTTP_LESSONS || [];

window.HTTP_LESSONS.push({
  id: 'desain-api',
  title: 'Desain API HTTP dan Perilaku Lanjutan',
  chapter: 'Desain & Kualitas',
  duration: '15–17 menit',
  intro: [
    'API yang baik bukan hanya API yang “bisa dipanggil”. Ia harus mudah diprediksi: URL menunjuk resource, method menyatakan niat, status code merangkum hasil, dan error memberi petunjuk yang bisa ditindaklanjuti. Konsistensi seperti ini menghemat waktu client, dokumentasi, dan debugging.',
    'Setelah dasar method, status, header, dan cache dikuasai, tantangan berikutnya adalah perilaku lanjutan: pagination, filter, sorting, versioning, idempotency, rate limit, range request, serta kapan memakai HTTP biasa, SSE, long polling, atau WebSocket.',
    'Bab ini merancang kontrak API katalog produk secara bertahap. Kita akan memetakan setiap endpoint ke method dan status yang tepat, menentukan format error, lalu menguji perilaku nyata di lab. Tujuannya bukan menghafal pola, tetapi mampu mengambil keputusan desain yang bisa dipertahankan.'
  ],
  objectives: [
    'Merancang URI dan operasi CRUD yang berorientasi resource',
    'Menentukan pagination, filtering, sorting, versioning, dan format error',
    'Menerapkan idempotency, rate limit, serta header yang informatif',
    'Memilih antara request-response, long polling, SSE, dan WebSocket'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Resource-Oriented Design</h3><p>Gunakan kata benda untuk resource dan method HTTP untuk aksi. Hindari URL seperti <code>/getProducts</code> atau <code>/deleteProduct?id=4</code> karena method sudah menyatakan aksi, dan URL seharusnya menunjuk sesuatu yang bisa dibaca.</p><table><thead><tr><th>Operasi</th><th>Method & URI</th><th>Status sukses</th></tr></thead><tbody><tr><td>Daftar produk</td><td><code>GET /products</code></td><td><code>200</code></td></tr><tr><td>Detail produk</td><td><code>GET /products/{id}</code></td><td><code>200</code> / <code>404</code></td></tr><tr><td>Buat produk</td><td><code>POST /products</code></td><td><code>201</code> + <code>Location</code></td></tr><tr><td>Ganti produk</td><td><code>PUT /products/{id}</code></td><td><code>200</code> / <code>204</code></td></tr><tr><td>Ubah sebagian</td><td><code>PATCH /products/{id}</code></td><td><code>200</code></td></tr><tr><td>Hapus produk</td><td><code>DELETE /products/{id}</code></td><td><code>204</code></td></tr></tbody></table><p>Gunakan bentuk jamak yang konsisten (<code>/products</code>, bukan campuran <code>/product</code> dan <code>/categories</code>). Batasi kedalaman nesting; jika hubungan terlalu dalam, pertimbangkan endpoint terpisah dengan filter.</p>'
    },
    {
      type: 'text',
      html: '<h3>Pagination, Filter, dan Sorting</h3><p>Untuk koleksi besar, jangan mengembalikan semuanya. Pilih salah satu gaya dan dokumentasikan:</p><ul><li><b>Offset pagination</b> — <code>?page=2&amp;limit=20</code>. Mudah dipahami, tetapi bisa melewatkan atau menggandakan item jika data berubah saat berpindah halaman.</li><li><b>Cursor pagination</b> — <code>?after=eyJpZCI6MTIzfQ&amp;limit=20</code>. Lebih stabil untuk data yang sering berubah, tetapi tidak mendukung lompat ke halaman tertentu dengan mudah.</li></ul><p>Filter dan sorting sebaiknya memakai nama field yang jelas: <code>?q=kopi&amp;min_price=20000&amp;sort=-price</code>. Tentukan daftar field yang boleh dipakai untuk sorting agar tidak menjadi celah injeksi atau beban query. Sertakan metadata seperti <code>total</code>, <code>next</code>, atau <code>has_more</code> agar client tahu cara melanjutkan.</p>'
    },
    {
      type: 'text',
      html: '<h3>Versioning dan Format Error</h3><p>API berubah. Versioning bisa dilakukan melalui path (<code>/v1/products</code>), header media type, atau query. Yang paling penting adalah kebijakan yang konsisten dan masa transisi yang jelas. Jangan membuat versi baru untuk setiap perubahan kecil; utamakan kompatibilitas ke belakang.</p><p>Format error yang baik membantu client mengambil keputusan:</p><pre><code>{\n  "error": "validation_error",\n  "message": "Data produk tidak valid.",\n  "details": [\n    { "field": "price", "issue": "harus berupa angka >= 0" }\n  ],\n  "request_id": "..."\n}</code></pre><p>Gunakan status code yang sesuai, kode error yang stabil, dan <code>request_id</code> untuk penelusuran. Jangan membocorkan stack trace, query database, atau detail internal pada respons produksi.</p>'
    },
    {
      type: 'example',
      title: 'Menguji Kontrak Katalog Produk',
      lang: 'bash',
      output: false,
      code: `# Daftar dengan pagination dan pencarian
curl -i 'http://localhost:8787/products?page=1&limit=2&q=kopi'

# Buat produk dengan idempotency key
curl -i -X POST http://localhost:8787/products \\
  -H 'Content-Type: application/json' \\
  -H 'Idempotency-Key: katalog-001' \\
  -d '{"name":"Gula Aren","price":25000,"stock":20}'

# Ulangi request yang sama: tidak boleh membuat duplikat
curl -i -X POST http://localhost:8787/products \\
  -H 'Content-Type: application/json' \\
  -H 'Idempotency-Key: katalog-001' \\
  -d '{"name":"Gula Aren","price":25000,"stock":20}'

# Validasi gagal → 422 dengan detail
curl -i -X POST http://localhost:8787/products \\
  -H 'Content-Type: application/json' \\
  -d '{"name":"A","price":-1,"stock":1.5}'`,

      explain: [
        'Parameter <code>page</code>, <code>limit</code>, dan <code>q</code> mengubah cara koleksi dibaca, sehingga cocok berada di query string.',
        'Idempotency key membuat request POST yang sama tidak menghasilkan produk ganda. Respons kedua memakai kembali hasil pertama dan menandai replay.',
        'Kegagalan validasi membalas <code>422</code> dengan daftar field yang bermasalah, bukan pesan umum “bad request”.'
      ]
    },
    {
      type: 'example',
      title: 'Range Request dan Header Informasi',
      lang: 'bash',
      output: false,
      code: `# Ambil 10 byte pertama
curl -i http://localhost:8787/range/sample.txt \\
  -H 'Range: bytes=0-9'

# Range yang tidak valid → 416 + Content-Range
curl -i http://localhost:8787/range/sample.txt \\
  -H 'Range: bytes=999-1200'

# Rate limit headers
curl -i http://localhost:8787/rate

# Retry-After saat kena limit
curl -i http://localhost:8787/status/429

# Redirect dengan Location
curl -i 'http://localhost:8787/redirect?to=/products'`,

      explain: [
        'Range request berguna untuk file besar, video, atau unduhan yang dapat dilanjutkan. Server membalas <code>206 Partial Content</code> dengan <code>Content-Range</code>.',
        'Header <code>X-RateLimit-Limit</code>, <code>Remaining</code>, dan <code>Reset</code> membantu client mengatur laju sebelum terkena <code>429</code>.',
        'Header <code>Location</code> pada redirect atau <code>201</code> memberi client URI tujuan yang jelas, sehingga client tidak perlu menebak.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Kapan HTTP Biasa Tidak Cukup?</h3><table><thead><tr><th>Pola</th><th>Cocok untuk</th><th>Keterbatasan</th></tr></thead><tbody><tr><td><b>Request-response</b></td><td>Operasi biasa, data tidak perlu real-time.</td><td>Client harus polling untuk perubahan.</td></tr><tr><td><b>Long polling</b></td><td>Notifikasi sederhana dengan kompatibilitas luas.</td><td>Koneksi ditahan; perlu penanganan timeout dan reconnect.</td></tr><tr><td><b>SSE</b></td><td>Stream satu arah dari server ke client.</td><td>Tidak cocok untuk komunikasi dua arah; perlu perhatian proxy buffering.</td></tr><tr><td><b>WebSocket</b></td><td>Komunikasi dua arah dengan latensi rendah.</td><td>Bukan HTTP request-response biasa; butuh manajemen koneksi dan autentikasi sendiri.</td></tr></tbody></table><p>Jangan memilih WebSocket hanya karena terlihat modern. Jika kebutuhan hanya menerima update berkala, SSE atau polling yang terukur bisa lebih sederhana dan lebih mudah dioperasikan.</p>'
    },
    {
      type: 'tip',
      title: 'Header Lanjutan Sesuai Kebutuhan',
      text: '<code>Retry-After</code> memberi tahu kapan boleh mencoba lagi. <code>Expect: 100-continue</code> dapat menghindari pengiriman body besar jika server akan menolak. <code>Prefer</code> dipakai pada beberapa API untuk preferensi seperti <code>return=minimal</code>. <code>Link</code> dapat membawa relasi pagination. <code>Trailer</code> berguna untuk metadata setelah body, tetapi dukungan infrastruktur bervariasi.'
    },
    {
      type: 'warn',
      title: 'Konsistensi Lebih Penting daripada Sempurna',
      text: 'Tidak ada satu format API yang sempurna untuk semua kasus. Yang merusak adalah ketidakkonsistenan: sebagian error memakai 200, sebagian memakai 400, penamaan field campur, dan pagination berbeda di setiap endpoint. Tetapkan konvensi, tulis di dokumentasi, lalu uji.'
    },
    {
      type: 'vocab',
      items: [
        ['Resource', 'Entitas yang direpresentasikan API, misalnya produk atau pesanan.'],
        ['Pagination', 'Pembagian koleksi besar menjadi beberapa halaman atau batch.'],
        ['Cursor pagination', 'Pagination berbasis penanda posisi data, lebih stabil untuk data berubah.'],
        ['Versioning', 'Strategi mengelola perubahan kontrak API tanpa memutus client lama.'],
        ['Idempotency key', 'Nilai unik agar operasi yang sama tidak dieksekusi berulang.'],
        ['SSE', 'Server-Sent Events, stream satu arah dari server ke client melalui HTTP.'],
        ['Range request', 'Permintaan sebagian representasi dengan header Range.'],
        ['Retry-After', 'Header yang memberi tahu kapan client boleh mencoba lagi.']
      ]
    }
  ],
  recap: [
    'API yang baik memakai URI berbasis resource, method yang tepat, dan status code yang konsisten.',
    'Pagination, filter, sorting, versioning, dan format error harus ditentukan sebagai kontrak, bukan improvisasi per endpoint.',
    'Idempotency key melindungi operasi berisiko dari duplikasi saat retry atau gangguan jaringan.',
    'Pilih request-response, long polling, SSE, atau WebSocket berdasarkan kebutuhan komunikasi dan biaya operasional.'
  ]
});
