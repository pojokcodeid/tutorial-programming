/* ============================================================
   Pelajaran HTTP — Bab 1: Persiapan Alat & Laboratorium HTTP
   ============================================================ */
'use strict';

window.HTTP_LESSONS = window.HTTP_LESSONS || [];

window.HTTP_LESSONS.push({
  id: 'persiapan-laboratorium',
  title: 'Persiapan Alat & Laboratorium HTTP',
  chapter: 'Fondasi',
  duration: '10–12 menit',
  intro: [
    'HTTP bukan teori yang cukup dibaca. Setiap konsep di materi ini akan terasa jelas ketika kamu melihat request keluar dari komputer, masuk ke server, lalu kembali sebagai response yang bisa dibaca baris per baris. Karena itu kita mulai dengan menyiapkan alat dan satu laboratorium kecil yang bisa dijalankan sendiri.',
    'Laboratoriumnya sengaja sederhana: satu server Node.js tanpa dependensi, satu terminal, satu browser, dan <code>curl</code>. Server itu menyediakan endpoint untuk mencoba method, status code, header, cookie, cache, CORS, sampai rate limit. Semua data disimpan di memori, jadi kamu bisa bereksperimen tanpa takut merusak apa pun.',
    'Bab ini adalah <b>Tahap 0</b> dari peta belajar HTTP. Setelah alat siap, kamu akan memakai lab yang sama di hampir semua bab berikutnya. Simpan catatan hasil percobaanmu — request, response, dan kesimpulan singkat — karena kebiasaan itu yang membedakan membaca teori dengan benar-benar memahami HTTP.'
  ],
  objectives: [
    'Menyiapkan browser, terminal, curl, dan Node.js untuk latihan HTTP',
    'Menjalankan laboratorium HTTP lokal dan memeriksa endpoint kesehatan',
    'Mengenal tab Network di DevTools serta file cookie jar untuk curl',
    'Mengetahui batas aman laboratorium dan kapan tidak boleh memakai data asli'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Alat yang Kamu Butuhkan</h3><p>Semua alat di bawah ini gratis dan sudah umum tersedia. Kamu tidak perlu memasang framework atau database.</p><ul><li><b>Browser modern</b> — Chrome, Firefox, Edge, atau Safari terbaru. Kita akan sering membuka <i>Developer Tools</i> → tab <b>Network</b>.</li><li><b>Terminal</b> — Terminal bawaan macOS/Linux, PowerShell, atau Windows Terminal.</li><li><b>curl</b> — hampir selalu sudah terpasang. Cek dengan <code>curl --version</code>.</li><li><b>Node.js 18+</b> — dipakai untuk menjalankan lab. Cek dengan <code>node --version</code>.</li><li><b>Editor teks</b> — VS Code, Sublime, atau editor apa pun untuk menyimpan catatan dan file latihan.</li></ul><p>Kalau salah satu perintah tidak dikenali, pasang alatnya lebih dahulu sebelum melanjutkan. Materi ini mengasumsikan perintah dijalankan dari folder utama proyek, yaitu folder yang berisi <code>index.html</code> dan folder <code>examples/</code>.</p>'
    },
    {
      type: 'text',
      html: '<h3>Peta Perjalanan Satu Request</h3><p>Sebelum mengetik perintah, bayangkan perjalanan ini: browser atau curl perlu mengetahui alamat IP server melalui <b>DNS</b>, membuka koneksi <b>TCP</b>, bernegosiasi <b>TLS</b> bila memakai HTTPS, lalu mengirim pesan <b>HTTP</b>. Server memproses pesan itu dan mengirim response. Setelah response diterima, koneksi bisa ditutup atau dipakai ulang.</p><ol><li><b>URL</b> memberi tahu scheme, host, port, path, dan query.</li><li><b>DNS</b> menerjemahkan nama host menjadi alamat IP.</li><li><b>TCP</b> menyediakan saluran komunikasi yang andal.</li><li><b>TLS</b> melindungi isi komunikasi pada HTTPS.</li><li><b>HTTP</b> membawa method, header, dan body request menuju server.</li><li>Server mengirim <b>status code</b>, header, dan body response.</li></ol><p>Pada bab-bab awal kita akan berhenti di lapisan HTTP. Lapisan DNS, TCP, dan TLS dibahas kembali saat masuk ke HTTPS dan infrastruktur.</p>'
    },
    {
      type: 'example',
      title: 'Menjalankan Laboratorium HTTP',
      lang: 'bash',
      output: false,
      code: `# dari folder utama proyek
node examples/http-lab/server.js

# output yang diharapkan (port bisa berbeda bila diubah)
# ──────────────────────────────────────────────
#   HTTP Lab — Belajar Koding
#   Buka: http://localhost:8787/
#   Endpoint: /health /echo /products /cache /login /cors
# ──────────────────────────────────────────────

# buka terminal kedua, lalu cek server
curl -i http://localhost:8787/health

# HTTP/1.1 200 OK
# Content-Type: application/json; charset=utf-8
# X-Request-Id: ...
#
# {
#   "ok": true,
#   "service": "http-lab",
#   ...
# }`,
      explain: [
        'Jalankan server di satu terminal dan biarkan tetap hidup. Perintah <code>curl</code> dijalankan di terminal kedua.',
        'Opsi <code>-i</code> pada curl menampilkan status line dan response header, bukan hanya body. Ini penting karena banyak perilaku HTTP justru terlihat di header.',
        'Header <code>X-Request-Id</code> adalah contoh header observability: satu nilai unik untuk menelusuri request yang sama di log server dan client.',
        'Bila port 8787 sedang dipakai, jalankan <code>PORT=9090 node examples/http-lab/server.js</code> lalu sesuaikan alamat curl.'
      ]
    },
    {
      type: 'example',
      title: 'Melihat Request dari Browser',
      lang: 'text',
      output: false,
      code: `1. Buka http://localhost:8787/ di browser.
2. Tekan F12 atau klik kanan → Inspect.
3. Pilih tab Network, lalu muat ulang halaman.
4. Klik request pertama (dokumen HTML).
5. Perhatikan:
   - Status dan method
   - Request Headers
   - Response Headers
   - Timing
6. Klik kanan request → Copy → Copy as cURL.

Tempel hasilnya di terminal. Kamu baru saja memindahkan
request browser menjadi perintah yang bisa diulang.`,
      explain: [
        'Tab Network menampilkan request yang benar-benar dilakukan browser, bukan hanya yang terlihat di halaman.',
        'Fitur <b>Copy as cURL</b> sangat berguna saat debugging: kamu bisa mengulang request yang gagal tanpa menebak header atau body yang dipakai.',
        'Jangan lupa mencentang <i>Preserve log</i> saat menelusuri redirect atau alur login, karena tanpa itu riwayat request bisa hilang ketika halaman berpindah.'
      ]
    },
    {
      type: 'tip',
      title: 'Praktik Langsung: Tiga Request Pertama',
      text: 'Jalankan tiga perintah ini dan catat status, header, serta body yang kamu lihat: <code>curl -i http://localhost:8787/health</code>, <code>curl -i "http://localhost:8787/echo?nama=Nina&amp;topik=http"</code>, dan <code>curl -i http://localhost:8787/headers</code>. Bandingkan hasilnya: endpoint mana yang mengembalikan JSON, header apa saja yang selalu ada, dan bagaimana query string muncul di respons?'
    },
    {
      type: 'warn',
      title: 'Lab Hanya untuk Belajar',
      text: 'Jangan membuka port lab ke internet, jangan memakai password asli, dan jangan mengirim data pribadi. Server ini menyimpan sesi dan produk di memori, memakai akun demo, serta tidak memiliki hardening produksi. Untuk latihan HTTPS, sertifikat yang dipakai adalah self-signed dan hanya cocok di komputer sendiri.'
    },
    {
      type: 'vocab',
      items: [
        ['Client', 'Pihak yang mengirim request, misalnya browser, aplikasi mobile, atau curl.'],
        ['Server', 'Pihak yang menerima request, memprosesnya, lalu mengirim response.'],
        ['curl', 'Program baris perintah untuk mengirim request HTTP dan menampilkan response secara transparan.'],
        ['DevTools Network', 'Panel browser yang merekam request, response, header, dan timing.'],
        ['Port', 'Nomor pintu logis pada satu alamat IP; lab ini memakai port 8787.'],
        ['DNS', 'Sistem yang menerjemahkan nama domain menjadi alamat IP.'],
        ['TLS', 'Lapisan keamanan yang menyediakan enkripsi dan autentikasi pada HTTPS.'],
        ['Cookie jar', 'Berkas tempat curl menyimpan cookie agar bisa dikirim kembali pada request berikutnya.']
      ]
    }
  ],
  recap: [
    'HTTP dipahami paling cepat dengan praktik: jalankan client dan server, lalu baca request/response yang terjadi.',
    'Laboratorium HTTP lokal berjalan dengan Node.js tanpa dependensi dan menyediakan endpoint untuk hampir semua topik materi.',
    'Gunakan curl dengan opsi -i atau -v, serta DevTools Network, untuk melihat status, header, dan body secara nyata.',
    'Lab hanya untuk latihan lokal; jangan memakai data asli atau membukanya ke internet.'
  ]
});
