/* ============================================================
   Pelajaran HTTP — Bab 10: Autentikasi dan Otorisasi
   ============================================================ */
'use strict';

window.HTTP_LESSONS = window.HTTP_LESSONS || [];

window.HTTP_LESSONS.push({
  id: 'autentikasi-otorisasi',
  title: 'Autentikasi, Otorisasi, dan Token',
  chapter: 'State & Keamanan',
  duration: '14–16 menit',
  intro: [
    'Dua pertanyaan berbeda sering tercampur saat membahas keamanan API: <b>siapa kamu?</b> dan <b>apa yang boleh kamu lakukan?</b> Pertanyaan pertama adalah autentikasi, pertanyaan kedua adalah otorisasi. Keduanya saling melengkapi, tetapi tidak bisa saling menggantikan.',
    'HTTP menyediakan beberapa cara membawa bukti identitas. Ada Basic authentication yang mengirim username dan password terenkode, cookie sesi yang membawa identifier, dan bearer token yang membawa kredensial bertanda tangan. Masing-masing punya konsekuensi keamanan, masa berlaku, dan cara pencabutan yang berbeda.',
    'Bab ini mempraktikkan alur login di lab: memperoleh token, mengakses profil, mencoba endpoint admin sebagai user biasa, lalu logout. Kita juga akan membahas JWT sebagai salah satu format token, refresh token, serta mengapa CORS bukan mekanisme autentikasi.'
  ],
  objectives: [
    'Membedakan autentikasi dan otorisasi dengan contoh nyata',
    'Membandingkan Basic auth, cookie sesi, dan bearer token',
    'Mempraktikkan login, akses profil, uji peran, dan logout di lab',
    'Menjelaskan masa berlaku token, refresh token, dan pencabutan akses'
  ],
  sections: [
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Perbedaan autentikasi dan otorisasi dalam satu request">
        <rect x="24" y="96" width="170" height="86" rx="10" class="u-box"/>
        <text x="109" y="126" class="u-title" text-anchor="middle">Request</text>
        <text x="109" y="149" class="u-lbl" text-anchor="middle">Authorization: Bearer ...</text>

        <rect x="250" y="42" width="200" height="86" rx="10" class="u-hl"/>
        <text x="350" y="72" class="u-title" text-anchor="middle">Autentikasi</text>
        <text x="350" y="95" class="u-lbl" text-anchor="middle">Siapa pemilik kredensial?</text>

        <rect x="250" y="158" width="200" height="86" rx="10" class="u-box"/>
        <text x="350" y="188" class="u-title" text-anchor="middle">Otorisasi</text>
        <text x="350" y="211" class="u-lbl" text-anchor="middle">Boleh melakukan apa?</text>

        <rect x="510" y="96" width="200" height="86" rx="10" class="u-box"/>
        <text x="610" y="126" class="u-title" text-anchor="middle">Hasil</text>
        <text x="610" y="149" class="u-lbl" text-anchor="middle">200 / 401 / 403</text>

        <line x1="198" y1="125" x2="246" y2="92" class="u-line"/>
        <line x1="198" y1="150" x2="246" y2="190" class="u-line"/>
        <line x1="454" y1="88" x2="506" y2="120" class="u-line"/>
        <line x1="454" y1="200" x2="506" y2="160" class="u-line"/>
        <text x="380" y="278" class="u-lbl" text-anchor="middle">401 = identitas belum terbukti · 403 = identitas valid, izin kurang</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 10.1</b> — Autentikasi membuktikan identitas; otorisasi memutuskan izin</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Autentikasi vs Otorisasi</h3><table><thead><tr><th>Aspek</th><th>Autentikasi</th><th>Otorisasi</th></tr></thead><tbody><tr><td>Pertanyaan</td><td>Siapa kamu?</td><td>Apa yang boleh kamu lakukan?</td></tr><tr><td>Contoh</td><td>Login dengan password, token, atau sertifikat.</td><td>Hanya admin boleh menghapus produk.</td></tr><tr><td>Kegagalan</td><td><code>401 Unauthorized</code></td><td><code>403 Forbidden</code></td></tr><tr><td>Urutan</td><td>Diperiksa lebih dahulu.</td><td>Diperiksa setelah identitas diketahui.</td></tr></tbody></table><p>Kesalahan umum adalah menganggap pengguna yang sudah login otomatis boleh melakukan apa saja. Login hanya membuktikan identitas. Setiap endpoint tetap harus memeriksa izin berdasarkan peran, kepemilikan resource, atau kebijakan lain.</p>'
    },
    {
      type: 'text',
      html: '<h3>Tiga Cara Membawa Identitas</h3><ul><li><b>Basic authentication</b> — header <code>Authorization: Basic base64(username:password)</code>. Base64 bukan enkripsi; tanpa HTTPS, kredensial bisa dibaca. Cocok hanya untuk alat internal sederhana dan tetap harus melalui TLS.</li><li><b>Cookie sesi</b> — server mengirim <code>Set-Cookie</code>, browser menyimpannya, lalu mengirim <code>Cookie</code> otomatis. Baik untuk aplikasi web karena cookie bisa <code>HttpOnly</code> dan <code>SameSite</code>.</li><li><b>Bearer token</b> — client mengirim <code>Authorization: Bearer &lt;token&gt;</code>. Cocok untuk API dan aplikasi mobile. Siapa pun yang memegang token dianggap berhak, sehingga token harus dijaga seperti password.</li></ul><p><b>JWT</b> (<i>JSON Web Token</i>) adalah format token yang berisi klaim seperti <code>sub</code>, <code>exp</code>, dan <code>role</code>, ditandatangani server. JWT memudahkan verifikasi tanpa lookup, tetapi isinya dapat dibaca siapa saja yang memegang token. Jangan menaruh data rahasia di dalamnya, dan selalu verifikasi tanda tangan serta masa berlaku.</p>'
    },
    {
      type: 'example',
      title: 'Login dan Akses Profil dengan Bearer Token',
      lang: 'bash',
      output: false,
      code: `# 1) Login sebagai user biasa
curl -i -X POST http://localhost:8787/login \\
  -H 'Content-Type: application/json' \\
  -d '{"username":"nina","password":"rahasia123"}'

# Respons berisi access_token dan Set-Cookie.
# Salin access_token ke variabel shell:
TOKEN=$(curl -s -X POST http://localhost:8787/login \\
  -H 'Content-Type: application/json' \\
  -d '{"username":"nina","password":"rahasia123"}' \\
  | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).access_token))")

# 2) Akses profil dengan token
curl -i http://localhost:8787/profile \\
  -H "Authorization: Bearer $TOKEN"

# 3) Coba endpoint admin sebagai user biasa
curl -i http://localhost:8787/admin \\
  -H "Authorization: Bearer $TOKEN"

# 4) Logout, lalu coba lagi
curl -i -X POST http://localhost:8787/logout \\
  -H "Authorization: Bearer $TOKEN"
curl -i http://localhost:8787/profile \\
  -H "Authorization: Bearer $TOKEN"`,
      explain: [
        'Login berhasil membalas <code>200</code> dengan token dan cookie. Token dipakai pada header <code>Authorization</code>, bukan di query string.',
        'Endpoint <code>/profile</code> membalas <code>200</code> karena identitas valid. Endpoint <code>/admin</code> membalas <code>403</code> karena user biasa tidak memiliki izin, meskipun tokennya sah.',
        'Setelah logout, token dicabut di server sehingga request berikutnya menghasilkan <code>401</code>. Ini menunjukkan pentingnya pencabutan sesi di sisi server.'
      ]
    },
    {
      type: 'example',
      title: 'Login Admin dan Bandingkan Hasil',
      lang: 'bash',
      output: false,
      code: `# Login admin
ADMIN=$(curl -s -X POST http://localhost:8787/login \\
  -H 'Content-Type: application/json' \\
  -d '{"username":"admin","password":"admin123"}' \\
  | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).access_token))")

curl -i http://localhost:8787/admin \\
  -H "Authorization: Bearer $ADMIN"

# Token salah atau tidak ada
curl -i http://localhost:8787/profile \\
  -H 'Authorization: Bearer token-palsu'

curl -i http://localhost:8787/profile`,
      explain: [
        'Admin mendapat <code>200</code> pada <code>/admin</code> karena perannya memenuhi syarat. Perbedaan hasil ini berasal dari otorisasi, bukan dari autentikasi.',
        'Token palsu menghasilkan <code>401</code>, bukan <code>403</code>, karena identitasnya tidak berhasil dibuktikan.',
        'Tanpa header Authorization, server juga membalas <code>401</code> dan menyertakan <code>WWW-Authenticate</code> sebagai petunjuk skema autentikasi.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Masa Berlaku, Refresh, dan Pencabutan</h3><p>Token yang berlaku selamanya adalah risiko besar. Praktik umum memakai <b>access token</b> berumur pendek (misalnya 15 menit) dan <b>refresh token</b> berumur lebih panjang yang disimpan aman. Saat access token kedaluwarsa, client menukar refresh token dengan access token baru.</p><p>Pencabutan token tidak selalu mudah. Session server bisa dihapus seketika; JWT stateless tetap valid sampai <code>exp</code> kecuali server memakai daftar pencabutan atau rotasi kunci. Karena itu, pilih masa berlaku pendek dan rancang mekanisme logout yang benar. Untuk aplikasi dengan risiko tinggi, pertimbangkan token opaque yang dapat dicabut.</p>'
    },
    {
      type: 'tip',
      title: 'Praktik Langsung',
      text: 'Uji tiga skenario: (1) tanpa token, (2) token user biasa, (3) token admin. Catat status dan body untuk <code>/profile</code> dan <code>/admin</code>. Lalu logout dan ulangi request dengan token yang sama. Jelaskan dengan kata-katamu mengapa status berubah.'
    },
    {
      type: 'warn',
      title: 'Jangan Menyimpan Token Sembarangan',
      text: 'Jangan menaruh token di URL, log, atau kode frontend yang terekspos. Di browser, hindari menyimpan token jangka panjang di <code>localStorage</code> bila ada alternatif cookie <code>HttpOnly</code> yang sesuai. Apa pun pilihannya, HTTPS, masa berlaku pendek, dan pencabutan yang benar tetap wajib.'
    },
    {
      type: 'vocab',
      items: [
        ['Autentikasi', 'Proses membuktikan identitas pemanggil.'],
        ['Otorisasi', 'Proses memutuskan tindakan apa yang boleh dilakukan identitas tersebut.'],
        ['Bearer token', 'Token yang dikirim di header Authorization dan dianggap sebagai bukti akses.'],
        ['JWT', 'Format token berisi klaim yang ditandatangani, misalnya sub, exp, dan role.'],
        ['Access token', 'Token berumur pendek untuk mengakses resource.'],
        ['Refresh token', 'Token berumur lebih panjang untuk memperoleh access token baru.'],
        ['WWW-Authenticate', 'Header pada 401 yang memberi tahu skema autentikasi yang diharapkan.'],
        ['Pencabutan token', 'Proses membuat token atau sesi tidak lagi berlaku sebelum masa kedaluwarsanya.']
      ]
    }
  ],
  recap: [
    'Autentikasi membuktikan identitas; otorisasi menentukan izin. Keduanya harus diperiksa terpisah.',
    'Basic auth, cookie sesi, dan bearer token memiliki trade-off keamanan dan kegunaan yang berbeda.',
    'JWT adalah format token, bukan jaminan keamanan; verifikasi tanda tangan, masa berlaku, dan klaim dengan benar.',
    'Gunakan access token berumur pendek, refresh token yang aman, serta mekanisme logout dan pencabutan yang jelas.'
  ]
});
