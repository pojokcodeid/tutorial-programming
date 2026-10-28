/* ============================================================
   Pelajaran HTTP — Bab 5: Method dan Semantik
   ============================================================ */
'use strict';

window.HTTP_LESSONS = window.HTTP_LESSONS || [];

window.HTTP_LESSONS.push({
  id: 'method-semantik',
  title: 'Method HTTP dan Semantik Safe/Idempotent',
  chapter: 'Semantik HTTP',
  duration: '13–15 menit',
  intro: [
    'Method HTTP bukan sekadar pilihan gaya. Method menyatakan <b>niat</b> terhadap resource, dan niat itu membawa konsekuensi: apakah request boleh diulang, apakah cache boleh menyimpannya, dan apakah browser atau proxy boleh mencoba lagi secara otomatis.',
    'Dua properti paling penting adalah <b>safe</b> dan <b>idempotent</b>. Safe berarti method tidak dimaksudkan mengubah state server. Idempotent berarti pengulangan request yang sama menghasilkan efek yang setara dengan satu kali eksekusi. Keduanya sering disalahpahami, terutama ketika orang mengira idempotent berarti response harus identik.',
    'Bab ini membahas GET, HEAD, POST, PUT, PATCH, DELETE, dan OPTIONS, lalu mempraktikkannya pada API katalog produk di lab. Setelah bab ini, kamu seharusnya bisa memilih method berdasarkan semantik, bukan karena “biasanya begitu”.'
  ],
  objectives: [
    'Menjelaskan tujuan setiap method HTTP yang umum dipakai',
    'Membedakan safe dan idempotent beserta contohnya',
    'Memilih antara PUT dan PATCH berdasarkan bentuk perubahan',
    'Mempraktikkan method CRUD pada API lokal dan membaca status yang dihasilkan'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Method yang Perlu Dikuasai</h3><table><thead><tr><th>Method</th><th>Makna umum</th><th>Safe</th><th>Idempotent</th></tr></thead><tbody><tr><td><b>GET</b></td><td>Mengambil representasi resource.</td><td>Ya</td><td>Ya</td></tr><tr><td><b>HEAD</b></td><td>Seperti GET, tetapi tanpa response body.</td><td>Ya</td><td>Ya</td></tr><tr><td><b>POST</b></td><td>Mengirim data untuk diproses; sering membuat resource.</td><td>Tidak</td><td>Umumnya tidak</td></tr><tr><td><b>PUT</b></td><td>Membuat atau mengganti representasi resource pada target URI.</td><td>Tidak</td><td>Ya</td></tr><tr><td><b>PATCH</b></td><td>Menerapkan perubahan parsial.</td><td>Tidak</td><td>Belum tentu</td></tr><tr><td><b>DELETE</b></td><td>Meminta penghapusan resource.</td><td>Tidak</td><td>Ya</td></tr><tr><td><b>OPTIONS</b></td><td>Menanyakan opsi komunikasi; dipakai pada CORS preflight.</td><td>Ya</td><td>Ya</td></tr></tbody></table><p><b>TRACE</b> dan <b>CONNECT</b> juga ada, tetapi sering dibatasi pada server, proxy, atau lingkungan tertentu karena alasan keamanan. Untuk aplikasi sehari-hari, fokuskan perhatian pada tujuh method di atas.</p>'
    },
    {
      type: 'text',
      html: '<h3>Safe dan Idempotent Itu Berbeda</h3><p><b>Safe</b> berbicara tentang apakah method dimaksudkan mengubah state. <b>Idempotent</b> berbicara tentang efek pengulangan. Contoh:</p><ul><li><code>GET /products</code> aman dan idempotent. Mengulanginya tidak mengubah data.</li><li><code>DELETE /products/4</code> tidak safe, tetapi idempotent. Menghapus dua kali menghasilkan keadaan akhir yang sama: produk tetap tidak ada. Response pertama bisa <code>204</code>, yang kedua bisa <code>404</code>, dan itu tetap boleh karena efeknya setara.</li><li><code>POST /orders</code> biasanya tidak idempotent. Mengirim dua kali bisa membuat dua pesanan berbeda. Untuk mencegahnya, gunakan <b>idempotency key</b>.</li><li><code>PATCH</code> bisa idempotent atau tidak, tergantung operasinya. <code>{"stock": 10}</code> idempotent; <code>{"increment": 1}</code> tidak.</li></ul><p>Idempotensi tidak berarti response harus sama persis. Yang penting adalah efek akhirnya terhadap resource.</p>'
    },
    {
      type: 'example',
      title: 'GET, HEAD, dan OPTIONS',
      lang: 'bash',
      output: false,
      code: `# GET: mengambil daftar produk
curl -i 'http://localhost:8787/products?page=1&limit=2'

# HEAD: hanya header, tanpa body
curl -I http://localhost:8787/products

# OPTIONS: melihat opsi komunikasi (CORS preflight)
curl -i -X OPTIONS http://localhost:8787/products \\
  -H 'Origin: http://localhost:8123' \\
  -H 'Access-Control-Request-Method: POST'

# GET tidak boleh dipakai untuk mengubah data:
# jangan membuat endpoint seperti GET /products/4/delete
# karena crawler, prefetch, atau cache bisa memanggilnya.`,
      explain: [
        '<code>HEAD</code> berguna untuk memeriksa status dan header tanpa mengunduh body, misalnya untuk mengecek keberadaan resource atau nilai <code>Content-Length</code>.',
        '<code>OPTIONS</code> pada CORS dipakai browser untuk bertanya apakah request lintas origin boleh dilakukan sebelum request sebenarnya dikirim.',
        'Mengubah data lewat GET berbahaya karena GET dianggap safe. Browser, crawler, dan cache dapat mengulang GET kapan saja tanpa niat pengguna.'
      ]
    },
    {
      type: 'example',
      title: 'POST, PUT, PATCH, dan DELETE',
      lang: 'bash',
      output: false,
      code: `# POST: membuat produk baru
curl -i -X POST http://localhost:8787/products \\
  -H 'Content-Type: application/json' \\
  -H 'Idempotency-Key: latihan-produk-001' \\
  -d '{"name":"Gula Aren","price":25000,"stock":20}'

# PUT: mengganti seluruh representasi produk id 1
curl -i -X PUT http://localhost:8787/products/1 \\
  -H 'Content-Type: application/json' \\
  -d '{"name":"Kopi Arabika","price":90000,"stock":10}'

# PATCH: hanya mengubah stok
curl -i -X PATCH http://localhost:8787/products/1 \\
  -H 'Content-Type: application/json' \\
  -d '{"stock":9}'

# DELETE: menghapus produk id 3
curl -i -X DELETE http://localhost:8787/products/3`,
      explain: [
        '<code>POST</code> sering dipakai untuk membuat resource baru. Karena pengulangan bisa membuat duplikat, lab mendukung <code>Idempotency-Key</code> untuk mengenali request yang sama.',
        '<code>PUT</code> mengganti seluruh representasi. Field yang tidak dikirim dianggap tidak ada atau kembali ke nilai default sesuai kontrak API, jadi pastikan kamu mengirim data lengkap.',
        '<code>PATCH</code> hanya mengubah field yang dikirim. <code>DELETE</code> yang berhasil umumnya membalas <code>204 No Content</code> karena tidak ada representasi baru yang perlu dikembalikan.'
      ]
    },
    {
      type: 'example',
      title: 'Mengamati Efek Pengulangan',
      lang: 'bash',
      output: false,
      code: `# Jalankan DELETE dua kali, lalu perhatikan statusnya
curl -i -X DELETE http://localhost:8787/products/2
curl -i -X DELETE http://localhost:8787/products/2

# Buat produk dengan Idempotency-Key yang sama dua kali
curl -s -X POST http://localhost:8787/products \\
  -H 'Content-Type: application/json' \\
  -H 'Idempotency-Key: sama-001' \\
  -d '{"name":"Produk Idempotent","price":10000,"stock":5}' -i

curl -s -X POST http://localhost:8787/products \\
  -H 'Content-Type: application/json' \\
  -H 'Idempotency-Key: sama-001' \\
  -d '{"name":"Produk Idempotent","price":10000,"stock":5}' -i`,
      explain: [
        'DELETE kedua bisa membalas <code>404</code> karena resource sudah tidak ada, tetapi keadaan akhirnya tetap sama. Itu sebabnya DELETE tetap dianggap idempotent.',
        'Dengan idempotency key yang sama, request POST kedua tidak membuat produk baru. Lab mengembalikan respons tersimpan dan menandainya dengan header <code>Idempotency-Replayed</code>.',
        'Dalam sistem nyata, idempotency key disimpan di database atau cache dengan masa berlaku, dan harus unik per operasi bisnis yang bermakna.'
      ]
    },
    {
      type: 'tip',
      title: 'Cara Cepat Memilih Method',
      text: 'Tanyakan tiga hal: (1) Apakah request hanya membaca? Jika ya, gunakan GET. (2) Apakah request mengganti seluruh resource atau hanya sebagian? Pilih PUT atau PATCH. (3) Apakah pengulangan request berbahaya? Jika ya, gunakan POST dengan idempotency key atau rancang operasi yang aman diulang.'
    },
    {
      type: 'warn',
      title: 'Jangan Menjadikan Method Sekadar Kebiasaan',
      text: 'Banyak API memakai POST untuk semua hal karena “lebih mudah”. Akibatnya caching, retry, izin, dan dokumentasi menjadi sulit. Method yang tepat membuat API lebih mudah diprediksi oleh client, proxy, dan alat observability.'
    },
    {
      type: 'vocab',
      items: [
        ['Safe', 'Method yang tidak dimaksudkan mengubah state server, misalnya GET dan HEAD.'],
        ['Idempotent', 'Sifat request yang pengulangannya menghasilkan efek setara dengan satu kali eksekusi.'],
        ['PUT', 'Method untuk membuat atau mengganti seluruh representasi resource pada target URI.'],
        ['PATCH', 'Method untuk menerapkan perubahan parsial terhadap resource.'],
        ['Idempotency key', 'Nilai unik dari client agar operasi yang sama tidak dieksekusi berulang.'],
        ['Preflight', 'Request OPTIONS yang dikirim browser untuk memeriksa izin CORS sebelum request sebenarnya.'],
        ['TRACE', 'Method diagnostik yang memantulkan request; sering dibatasi karena alasan keamanan.']
      ]
    }
  ],
  recap: [
    'Method menyatakan niat terhadap resource, bukan sekadar cara mengirim data.',
    'Safe berarti tidak mengubah state; idempotent berarti pengulangan memberi efek yang setara.',
    'PUT mengganti seluruh representasi, sedangkan PATCH mengubah sebagian; POST untuk operasi yang biasanya tidak idempotent.',
    'Gunakan idempotency key untuk operasi berisiko seperti pembuatan pesanan atau pembayaran.'
  ]
});
