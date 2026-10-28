/* ============================================================
   Pelajaran HTTP — Bab 7: Header Penting
   ============================================================ */
'use strict';

window.HTTP_LESSONS = window.HTTP_LESSONS || [];

window.HTTP_LESSONS.push({
  id: 'header-penting',
  title: 'Header Penting di Balik Layar',
  chapter: 'Semantik HTTP',
  duration: '12–14 menit',
  intro: [
    'Kalau status code adalah ringkasan hasil, header adalah tempat detailnya. Header menjelaskan format body, aturan cache, identitas pemanggil, keamanan, koneksi, dan informasi observability. Banyak bug “aneh” sebenarnya selesai hanya dengan membaca header yang tepat.',
    'Header bisa dikirim client, server, atau keduanya. Client memakai header untuk menyatakan preferensi dan kredensial; server memakai header untuk menjelaskan response dan memberi instruksi kepada cache atau browser. Ada juga header yang ditambahkan proxy dan gateway.',
    'Bab ini mengelompokkan header yang wajib dikenal: representasi, negosiasi, cache, koneksi, keamanan, dan observability. Kita akan memeriksa header nyata lewat <code>/headers</code> dan <code>/echo</code>, lalu membahas header mana yang aman diubah dan mana yang sebaiknya diserahkan kepada infrastruktur.'
  ],
  objectives: [
    'Mengenali header untuk body, negosiasi, cache, keamanan, dan observability',
    'Menggunakan curl untuk mengirim header dan memeriksa response header',
    'Memahami peran Host, Content-Type, Accept, dan Authorization',
    'Mengetahui header yang ditambahkan proxy serta risikonya bila dipercaya sembarangan'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Kelompok Header yang Perlu Dikenal</h3><table><thead><tr><th>Kelompok</th><th>Contoh</th><th>Fungsi</th></tr></thead><tbody><tr><td><b>Representasi</b></td><td><code>Content-Type</code>, <code>Content-Length</code>, <code>Content-Encoding</code></td><td>Menjelaskan format, ukuran, dan kompresi body.</td></tr><tr><td><b>Negosiasi</b></td><td><code>Accept</code>, <code>Accept-Language</code>, <code>Accept-Encoding</code></td><td>Menyatakan format yang diinginkan client.</td></tr><tr><td><b>Cache</b></td><td><code>Cache-Control</code>, <code>ETag</code>, <code>Last-Modified</code>, <code>Vary</code>, <code>Age</code></td><td>Mengatur penyimpanan dan validasi respons.</td></tr><tr><td><b>Koneksi</b></td><td><code>Connection</code>, <code>Keep-Alive</code></td><td>Mengatur perilaku koneksi pada HTTP/1.1.</td></tr><tr><td><b>Redirect</b></td><td><code>Location</code></td><td>Menunjukkan tujuan redirect atau resource baru.</td></tr><tr><td><b>Keamanan</b></td><td><code>Strict-Transport-Security</code>, <code>Content-Security-Policy</code>, <code>X-Content-Type-Options</code>, <code>Referrer-Policy</code></td><td>Membatasi perilaku browser dan mengurangi risiko.</td></tr><tr><td><b>Identitas</b></td><td><code>Authorization</code>, <code>WWW-Authenticate</code></td><td>Membawa kredensial dan menantang autentikasi.</td></tr><tr><td><b>Observability</b></td><td><code>traceparent</code>, <code>X-Request-Id</code></td><td>Menghubungkan request dengan trace dan log.</td></tr></tbody></table>'
    },
    {
      type: 'text',
      html: '<h3>Host, Content-Type, dan Accept</h3><p><b>Host</b> wajib pada HTTP/1.1. Ia memberi tahu server nama host yang dituju sehingga satu alamat IP bisa melayani banyak domain. <b>Content-Type</b> menjelaskan format body yang dikirim. <b>Accept</b> menyatakan format respons yang dapat diterima client.</p><p>Perhatikan bahwa <code>Content-Type</code> dan <code>Accept</code> bukan pasangan yang sama:</p><ul><li><code>Content-Type: application/json</code> pada request berarti body request berformat JSON.</li><li><code>Accept: application/json</code> berarti client ingin response JSON.</li><li>Pada response, <code>Content-Type</code> menjelaskan body response yang benar-benar dikirim server.</li></ul><p>Header <code>Accept-Encoding</code> menyatakan kompresi yang didukung, misalnya <code>gzip</code> atau <code>br</code>. Server boleh memilih salah satunya dan menandai respons dengan <code>Content-Encoding</code>.</p>'
    },
    {
      type: 'example',
      title: 'Mengirim dan Membaca Header',
      lang: 'bash',
      output: false,
      code: `# Lihat seluruh request header yang diterima server
curl -i http://localhost:8787/headers

# Kirim header sendiri
curl -i http://localhost:8787/headers \\
  -H 'Accept: application/json' \\
  -H 'X-Demo: belajar-http' \\
  -H 'User-Agent: LatihanHTTP/1.0'

# Lihat header response dari endpoint cache
curl -i http://localhost:8787/cache

# Minta respons terkompresi
curl -i --compressed http://localhost:8787/gzip`,
      explain: [
        'Nama header tidak membedakan huruf besar-kecil, tetapi nilai header bisa memiliki aturan khusus sesuai jenisnya.',
        'Header yang diawali <code>X-</code> adalah konvensi lama untuk header nonstandar. Banyak sistem masih memakainya, meskipun praktik modern mendorong nama yang terdaftar atau terdokumentasi.',
        'Pada <code>/cache</code>, kamu akan melihat <code>ETag</code> dan <code>Cache-Control</code>; keduanya dibahas lebih dalam pada bab caching.'
      ]
    },
    {
      type: 'example',
      title: 'Header yang Ditambahkan Proxy',
      lang: 'text',
      output: false,
      code: `Request melewati proxy:

X-Forwarded-For: 203.0.113.10
X-Forwarded-Proto: https
X-Forwarded-Host: api.example.com
X-Request-Id: 1f2e...

Server backend harus tahu:
- Siapa client asli?
- Apakah koneksi asli HTTPS?
- Siapa yang menambahkan header ini?

Jangan percaya header forwarded dari koneksi yang tidak
berasal dari proxy tepercaya.`,
      explain: [
        'Proxy sering menambahkan <code>X-Forwarded-For</code> agar backend tahu alamat client asli, bukan alamat proxy.',
        'Header forwarded bisa dipalsukan client jika server menerima koneksi langsung. Batasi backend agar hanya bisa diakses dari proxy tepercaya.',
        'Header <code>traceparent</code> dari standar W3C Trace Context menghubungkan request dengan distributed tracing.'
      ]
    },
    {
      type: 'tip',
      title: 'Praktik Langsung',
      text: 'Kirim request ke <code>/headers</code> dengan tiga header buatanmu, lalu cari header tersebut di respons. Setelah itu, ubah <code>Accept</code> menjadi <code>text/html</code> dan panggil <code>/negotiate</code>. Perhatikan bahwa server memilih format berdasarkan header yang kamu kirim, bukan berdasarkan tebakan.'
    },
    {
      type: 'warn',
      title: 'Jangan Mencatat Header Sensitif',
      text: 'Header <code>Authorization</code>, <code>Cookie</code>, dan header berisi token sering ikut tercatat di log. Redaksi nilainya sebelum log disimpan atau dikirim ke sistem monitoring. Header yang tampak tidak berbahaya pun bisa membocorkan identitas atau sesi.'
    },
    {
      type: 'vocab',
      items: [
        ['Host', 'Header HTTP/1.1 yang menyebut nama host tujuan.'],
        ['Content-Type', 'Header yang menjelaskan format body request atau response.'],
        ['Accept', 'Header yang menyatakan format respons yang diinginkan client.'],
        ['Content-Encoding', 'Header yang menyebut kompresi body, misalnya gzip atau br.'],
        ['Cache-Control', 'Header yang mengatur boleh tidaknya respons disimpan cache.'],
        ['ETag', 'Nilai versi representasi untuk validasi cache.'],
        ['Authorization', 'Header yang membawa kredensial atau bearer token.'],
        ['traceparent', 'Header standar untuk menghubungkan request dengan trace terdistribusi.']
      ]
    }
  ],
  recap: [
    'Header membawa metadata yang menjelaskan body, negosiasi, cache, keamanan, dan identitas.',
    'Content-Type menjelaskan body yang dikirim; Accept menyatakan format respons yang diinginkan.',
    'Header forwarded seperti X-Forwarded-For hanya boleh dipercaya dari proxy tepercaya.',
    'Redaksi header sensitif sebelum masuk ke log atau sistem observability.'
  ]
});
