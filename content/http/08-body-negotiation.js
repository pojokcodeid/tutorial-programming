/* ============================================================
   Pelajaran HTTP — Bab 8: Body, Media Type, dan Negosiasi
   ============================================================ */
'use strict';

window.HTTP_LESSONS = window.HTTP_LESSONS || [];

window.HTTP_LESSONS.push({
  id: 'body-negotiation',
  title: 'Body, Media Type, dan Content Negotiation',
  chapter: 'Semantik HTTP',
  duration: '12–14 menit',
  intro: [
    'Body adalah tempat data sebenarnya dikirim. Namun body tidak bisa dibaca dengan benar tanpa metadata: apakah isinya JSON, form, HTML, atau file biner? Di sinilah <b>media type</b> atau <b>Content-Type</b> berperan.',
    'Content negotiation adalah percakapan tentang format. Client mengirim <code>Accept</code>, server memilih representasi yang tersedia, lalu memberi tahu pilihan itu lewat <code>Content-Type</code>. Jika tidak ada yang cocok, server dapat membalas <code>406 Not Acceptable</code>.',
    'Bab ini mempraktikkan JSON, form URL-encoded, multipart, kompresi, dan upload. Kita juga akan membedakan <b>media type</b> (format data) dari <b>content encoding</b> (cara data dikompresi), karena keduanya sering tertukar.'
  ],
  objectives: [
    'Memilih Content-Type yang tepat untuk JSON, form, dan file',
    'Memahami perbedaan media type, charset, dan content encoding',
    'Mempraktikkan content negotiation dengan header Accept',
    'Mengirim body dan file ke server lokal serta memeriksa hasilnya'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Media Type yang Sering Dipakai</h3><table><thead><tr><th>Content-Type</th><th>Dipakai untuk</th></tr></thead><tbody><tr><td><code>application/json</code></td><td>Data terstruktur untuk API modern.</td></tr><tr><td><code>application/x-www-form-urlencoded</code></td><td>Form HTML sederhana; pasangan kunci-nilai di-encode.</td></tr><tr><td><code>multipart/form-data</code></td><td>Form dengan file atau banyak bagian.</td></tr><tr><td><code>text/plain; charset=utf-8</code></td><td>Teks biasa.</td></tr><tr><td><code>text/html; charset=utf-8</code></td><td>Dokumen HTML.</td></tr><tr><td><code>application/octet-stream</code></td><td>Data biner umum.</td></tr><tr><td><code>image/png</code></td><td>Gambar PNG.</td></tr></tbody></table><p><b>Charset</b> menjelaskan encoding karakter, misalnya UTF-8. Tanpa charset yang benar, huruf beraksen atau emoji bisa tampil rusak. Untuk API modern, UTF-8 adalah pilihan default yang aman.</p>'
    },
    {
      type: 'text',
      html: '<h3>Content Negotiation</h3><p>Client dapat mengirim beberapa preferensi dalam satu header:</p><pre><code>Accept: application/json, text/html;q=0.8, */*;q=0.1</code></pre><p>Nilai <code>q</code> adalah faktor kualitas 0–1. Server boleh memilih format yang tersedia dan dianggap paling cocok. Server juga sebaiknya mengirim <code>Vary: Accept</code> agar cache tidak menyajikan HTML kepada client yang meminta JSON.</p><p>Jika server tidak bisa memenuhi format yang diminta, <code>406 Not Acceptable</code> lebih jujur daripada mengirim format lain tanpa penjelasan.</p>'
    },
    {
      type: 'example',
      title: 'JSON dan Form URL-Encoded',
      lang: 'bash',
      output: false,
      code: `# Body JSON
curl -i -X POST http://localhost:8787/echo \\
  -H 'Content-Type: application/json' \\
  -d '{"nama":"Nina","topik":"HTTP"}'

# Body form URL-encoded
curl -i -X POST http://localhost:8787/echo \\
  -H 'Content-Type: application/x-www-form-urlencoded' \\
  --data 'username=nina&aktif=true'

# Nilai dengan spasi dan karakter khusus
curl -i -X POST http://localhost:8787/echo \\
  -H 'Content-Type: application/x-www-form-urlencoded' \\
  --data-urlencode 'catatan=belajar HTTP dari nol'`,
      explain: [
        'JSON memakai tanda kutip ganda dan struktur objek/array. Pastikan body benar-benar valid; server akan membalas 400 bila JSON rusak.',
        'Form URL-encoded memakai pasangan <code>kunci=nilai</code> yang dipisahkan <code>&amp;</code>. Format ini umum pada form HTML biasa.',
        '<code>--data-urlencode</code> membantu meng-encode spasi dan karakter khusus agar tidak salah ditafsirkan.'
      ]
    },
    {
      type: 'example',
      title: 'Multipart, Upload, dan Kompresi',
      lang: 'bash',
      output: false,
      code: `# Kirim file lewat multipart (endpoint /echo akan menampilkan body mentah)
printf 'contoh isi file\\n' > contoh.txt
curl -i -X POST http://localhost:8787/echo \\
  -F 'deskripsi=contoh upload' \\
  -F 'file=@contoh.txt'

# /upload hanya melaporkan ukuran dan hash body
curl -i -X POST http://localhost:8787/upload \\
  -H 'Content-Type: text/plain' \\
  --data 'isi file latihan'

# Minta respons terkompresi
curl -i --compressed http://localhost:8787/gzip

# Lihat pilihan format
curl -i http://localhost:8787/negotiate -H 'Accept: application/json'
curl -i http://localhost:8787/negotiate -H 'Accept: text/html'
curl -i http://localhost:8787/negotiate -H 'Accept: image/png'`,
      explain: [
        'Multipart memakai <code>boundary</code> untuk memisahkan bagian. Header <code>Content-Type</code> memuat boundary tersebut, sehingga server bisa memisahkan field dan file.',
        'Endpoint <code>/upload</code> pada lab tidak mengurai multipart; ia hanya menerima body dan melaporkan ukuran serta hash. Ini cukup untuk melihat perilaku dasar upload.',
        'Permintaan <code>Accept: image/png</code> ke <code>/negotiate</code> menghasilkan 406 karena server tidak menyediakan representasi gambar.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Content-Length, Chunked, dan Batas Ukuran</h3><p>Pada HTTP/1.1, body bisa dikirim dengan <code>Content-Length</code> yang diketahui lebih dahulu, atau dengan <i>chunked transfer coding</i> bila ukurannya belum diketahui. HTTP/2 dan HTTP/3 memiliki framing sendiri, sehingga tidak lagi bergantung pada teks chunked yang sama.</p><p>Server tetap harus membatasi ukuran body. Tanpa batas, penyerang bisa mengirim data sangat besar untuk menghabiskan memori atau disk. Lab membatasi body 1 MiB dan membalas <code>413 Payload Too Large</code> bila melewati batas.</p>'
    },
    {
      type: 'tip',
      title: 'Praktik Langsung',
      text: 'Panggil <code>/echo</code> dengan tiga format body berbeda, lalu bandingkan header <code>Content-Type</code> dan isi body yang dikembalikan. Setelah itu panggil <code>/negotiate</code> dengan <code>Accept: application/json</code>, <code>text/html</code>, dan <code>image/png</code>. Catat status dan <code>Content-Type</code> yang dipilih server.'
    },
    {
      type: 'warn',
      title: 'Jangan Menerima Semua Content-Type',
      text: 'Server yang mengurai body tanpa memeriksa <code>Content-Type</code> bisa salah menafsirkan data atau membuka celah parsing. Tolak format yang tidak didukung dengan <code>415 Unsupported Media Type</code>, dan batasi ukuran body sebelum membaca seluruhnya ke memori.'
    },
    {
      type: 'vocab',
      items: [
        ['Media type', 'Format data yang dinyatakan dengan Content-Type, misalnya application/json.'],
        ['Content negotiation', 'Proses memilih representasi berdasarkan preferensi client dan kemampuan server.'],
        ['Charset', 'Aturan encoding karakter, umumnya UTF-8 untuk API modern.'],
        ['Multipart', 'Format body yang memisahkan beberapa bagian dengan boundary, sering untuk file.'],
        ['Content-Encoding', 'Kompresi yang diterapkan pada body, misalnya gzip atau br.'],
        ['Chunked', 'Cara mengirim body HTTP/1.1 dalam potongan ketika ukuran belum diketahui.'],
        ['413 Payload Too Large', 'Status ketika body melebihi batas yang diterima server.']
      ]
    }
  ],
  recap: [
    'Content-Type menjelaskan format body; Accept menyatakan format respons yang diinginkan client.',
    'Media type berbeda dari content encoding: JSON adalah format, gzip adalah cara mengompresinya.',
    'Multipart dipakai untuk file dan form kompleks; batas ukuran body wajib diterapkan server.',
    'Content negotiation yang benar juga mempertimbangkan header Vary agar cache tidak salah menyajikan format.'
  ]
});
