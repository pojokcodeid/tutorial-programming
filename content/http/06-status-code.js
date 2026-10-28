/* ============================================================
   Pelajaran HTTP — Bab 6: Status Code
   ============================================================ */
'use strict';

window.HTTP_LESSONS = window.HTTP_LESSONS || [];

window.HTTP_LESSONS.push({
  id: 'status-code',
  title: 'Status Code dan Pemilihannya',
  chapter: 'Semantik HTTP',
  duration: '13–15 menit',
  intro: [
    'Status code adalah ringkasan satu angka tentang apa yang terjadi pada sebuah request. Client memakainya untuk memutuskan apakah harus menampilkan data, mengulang request, meminta login, atau berhenti. Proxy dan alat monitoring juga memakainya untuk menghitung tingkat keberhasilan.',
    'Masalahnya, banyak API memakai <code>200</code> untuk semuanya, termasuk error. Pola itu memaksa client membaca body untuk menebak hasil, merusak cache, dan menyulitkan observability. Status code yang tepat adalah bagian dari kontrak API, bukan hiasan.',
    'Kita akan membahas kelompok 2xx sampai 5xx, beberapa kode yang paling sering dipakai, lalu berlatih memilih status untuk skenario nyata. Lab menyediakan endpoint <code>/status/{kode}</code> agar kamu bisa melihat header dan body yang menyertainya.'
  ],
  objectives: [
    'Membedakan kelompok status 2xx, 3xx, 4xx, dan 5xx',
    'Memilih status code yang tepat untuk CRUD dan kesalahan validasi',
    'Membedakan 401 vs 403 serta 400 vs 422',
    'Memahami kapan 429, 502, 503, dan 504 muncul'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Kelompok Status</h3><table><thead><tr><th>Kelompok</th><th>Arti</th><th>Contoh</th></tr></thead><tbody><tr><td><b>1xx</b></td><td>Informasi sementara</td><td><code>100 Continue</code></td></tr><tr><td><b>2xx</b></td><td>Berhasil</td><td><code>200</code>, <code>201</code>, <code>204</code></td></tr><tr><td><b>3xx</b></td><td>Redirect atau resource lain</td><td><code>301</code>, <code>302</code>, <code>304</code></td></tr><tr><td><b>4xx</b></td><td>Kesalahan dari sisi client</td><td><code>400</code>, <code>401</code>, <code>404</code>, <code>429</code></td></tr><tr><td><b>5xx</b></td><td>Kesalahan dari sisi server</td><td><code>500</code>, <code>502</code>, <code>503</code>, <code>504</code></td></tr></tbody></table><p>Angka pertama adalah kelompok; dua angka berikutnya memberi detail. Client yang baik tidak perlu menghafal semua kode, tetapi harus memahami kelompok dan kode yang dipakai kontrak API-nya.</p>'
    },
    {
      type: 'text',
      html: '<h3>Kode yang Paling Sering Dipakai</h3><table><thead><tr><th>Kode</th><th>Kapan dipakai</th></tr></thead><tbody><tr><td><b>200 OK</b></td><td>Request berhasil dan ada representasi yang dikembalikan.</td></tr><tr><td><b>201 Created</b></td><td>Resource baru dibuat; sertakan <code>Location</code> bila ada URI resource.</td></tr><tr><td><b>202 Accepted</b></td><td>Request diterima untuk diproses asinkron; hasil belum tersedia.</td></tr><tr><td><b>204 No Content</b></td><td>Berhasil, tetapi tidak ada body, misalnya setelah DELETE.</td></tr><tr><td><b>301 / 302</b></td><td>Redirect permanen / sementara; lihat header <code>Location</code>.</td></tr><tr><td><b>304 Not Modified</b></td><td>Representasi belum berubah; client boleh memakai cache.</td></tr><tr><td><b>400 Bad Request</b></td><td>Sintaks atau parameter request tidak valid.</td></tr><tr><td><b>401 Unauthorized</b></td><td>Kredensial tidak ada atau tidak valid.</td></tr><tr><td><b>403 Forbidden</b></td><td>Identitas valid, tetapi tidak memiliki izin.</td></tr><tr><td><b>404 Not Found</b></td><td>Resource tidak ditemukan.</td></tr><tr><td><b>405 Method Not Allowed</b></td><td>Method tidak didukung untuk resource; kirim header <code>Allow</code>.</td></tr><tr><td><b>409 Conflict</b></td><td>Konflik state, misalnya nama duplikat atau versi bentrok.</td></tr><tr><td><b>415 Unsupported Media Type</b></td><td>Format body tidak didukung.</td></tr><tr><td><b>422 Unprocessable Content</b></td><td>Sintaks dipahami, tetapi validasi bisnis gagal.</td></tr><tr><td><b>429 Too Many Requests</b></td><td>Rate limit tercapai; kirim <code>Retry-After</code>.</td></tr><tr><td><b>500 Internal Server Error</b></td><td>Bug atau kesalahan tak terduga di server.</td></tr><tr><td><b>502 Bad Gateway</b></td><td>Gateway menerima respons tidak valid dari upstream.</td></tr><tr><td><b>503 Service Unavailable</b></td><td>Layanan sementara tidak tersedia, misalnya maintenance atau overload.</td></tr><tr><td><b>504 Gateway Timeout</b></td><td>Gateway kehabisan waktu menunggu upstream.</td></tr></tbody></table>'
    },
    {
      type: 'text',
      html: '<h3>401 vs 403 dan 400 vs 422</h3><p>Dua pasangan ini paling sering tertukar:</p><ul><li><b>401</b> berarti kamu belum terbukti siapa dirimu, atau kredensialmu tidak valid. Biasanya disertai <code>WWW-Authenticate</code>. <b>403</b> berarti identitasmu sudah dikenali, tetapi aksinya tidak diizinkan.</li><li><b>400</b> untuk request yang secara sintaks atau bentuk tidak valid, misalnya JSON rusak. <b>422</b> untuk request yang bentuknya valid, tetapi gagal aturan bisnis, misalnya harga negatif atau email sudah dipakai.</li></ul><p>Konsistensi lebih penting daripada perdebatan sempurna. Pilih satu kebijakan, dokumentasikan, dan terapkan di seluruh API.</p>'
    },
    {
      type: 'example',
      title: 'Mencoba Status Code di Lab',
      lang: 'bash',
      output: false,
      code: `# 201 Created
curl -i http://localhost:8787/status/201

# 204 No Content: perhatikan body kosong
curl -i http://localhost:8787/status/204

# 401: perhatikan header WWW-Authenticate
curl -i http://localhost:8787/status/401

# 429: perhatikan Retry-After
curl -i http://localhost:8787/status/429

# 302: perhatikan Location
curl -i http://localhost:8787/status/302

# 500 dan 503
curl -i http://localhost:8787/status/500
curl -i http://localhost:8787/status/503`,
      explain: [
        'Status <code>204</code> tidak boleh memiliki body. Jika kamu melihat body pada respons 204, itu tanda implementasi tidak mengikuti semantik HTTP.',
        'Header <code>WWW-Authenticate</code> pada 401 memberi tahu client skema autentikasi yang diharapkan, misalnya Bearer.',
        'Header <code>Retry-After</code> pada 429 membantu client menunggu sebelum mencoba lagi, bukan mengulang secepat mungkin.'
      ]
    },
    {
      type: 'example',
      title: 'Status pada CRUD Produk',
      lang: 'bash',
      output: false,
      code: `# Berhasil membuat produk → 201 + Location
curl -i -X POST http://localhost:8787/products \\
  -H 'Content-Type: application/json' \\
  -d '{"name":"Produk Status","price":15000,"stock":3}'

# Body bukan JSON → 415
curl -i -X POST http://localhost:8787/products \\
  -H 'Content-Type: text/plain' \\
  -d 'halo'

# JSON valid tetapi data tidak valid → 422
curl -i -X POST http://localhost:8787/products \\
  -H 'Content-Type: application/json' \\
  -d '{"name":"A","price":-1,"stock":1.5}'

# Nama duplikat → 409
curl -i -X POST http://localhost:8787/products \\
  -H 'Content-Type: application/json' \\
  -d '{"name":"Kopi Arabika","price":85000,"stock":2}'

# Method tidak didukung → 405 + Allow
curl -i -X PUT http://localhost:8787/products`,
      explain: [
        'Status yang berbeda memberi informasi berbeda tanpa harus membaca body. Client bisa menangani 415 dan 422 dengan pesan yang lebih tepat.',
        'Untuk <code>201</code>, header <code>Location</code> menunjukkan URI resource yang baru dibuat.',
        'Untuk <code>405</code>, header <code>Allow</code> memberi tahu method apa yang tersedia. Ini lebih informatif daripada sekadar 404.'
      ]
    },
    {
      type: 'tip',
      title: 'Latihan Memilih Status',
      text: 'Tentukan status untuk sepuluh skenario: login berhasil, login salah, produk tidak ditemukan, validasi harga gagal, nama duplikat, DELETE berhasil, method tidak didukung, JSON rusak, rate limit, dan database mati. Bandingkan jawabanmu dengan pasangan 200/401/404/422/409/204/405/400/429/500. Diskusikan mengapa setiap pilihan lebih tepat daripada 200 untuk semuanya.'
    },
    {
      type: 'warn',
      title: 'Jangan Menyembunyikan Error di Status 200',
      text: 'Mengembalikan <code>200</code> dengan body <code>{"success":false}</code> membuat cache, monitoring, dan client otomatis salah membaca hasil. Gunakan status code yang sesuai, lalu sertakan detail error di body dengan format yang konsisten.'
    },
    {
      type: 'vocab',
      items: [
        ['Status code', 'Angka tiga digit yang merangkum hasil pemrosesan request.'],
        ['201 Created', 'Status untuk resource baru yang berhasil dibuat.'],
        ['204 No Content', 'Status berhasil tanpa body response.'],
        ['304 Not Modified', 'Status yang memberi tahu client bahwa cache masih valid.'],
        ['401 Unauthorized', 'Kredensial tidak ada atau tidak valid.'],
        ['403 Forbidden', 'Identitas valid, tetapi tidak memiliki izin.'],
        ['422 Unprocessable Content', 'Request dipahami, tetapi data gagal validasi bisnis.'],
        ['502 / 504', 'Kesalahan gateway terhadap upstream: respons tidak valid atau timeout.']
      ]
    }
  ],
  recap: [
    'Status code dibagi menjadi kelompok 1xx–5xx; angka pertama menunjukkan kelas hasil.',
    'Gunakan 201 untuk create, 204 untuk sukses tanpa body, 401 untuk kredensial, dan 403 untuk izin.',
    '400 menandakan request tidak valid secara bentuk; 422 menandakan validasi bisnis gagal.',
    'Status yang konsisten membuat client, cache, dan monitoring bekerja lebih baik.'
  ]
});
