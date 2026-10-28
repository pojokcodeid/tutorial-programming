/* ============================================================
   Pelajaran HTTP — Bab 13: CORS dan Keamanan HTTP
   ============================================================ */
'use strict';

window.HTTP_LESSONS = window.HTTP_LESSONS || [];

window.HTTP_LESSONS.push({
  id: 'cors-keamanan',
  title: 'CORS dan Keamanan HTTP',
  chapter: 'Keamanan & Transport',
  duration: '15–17 menit',
  intro: [
    'Browser memberlakukan <b>same-origin policy</b>: skrip dari satu origin tidak bebas membaca respons dari origin lain. Origin terdiri dari scheme, host, dan port. Kebijakan ini melindungi pengguna dari situs jahat yang mencoba membaca data sensitif dari situs lain menggunakan cookie atau sesi yang sudah ada.',
    '<b>CORS</b> (<i>Cross-Origin Resource Sharing</i>) adalah cara server memberi izin terkontrol kepada origin lain. Izin itu diberikan melalui header respons, dan untuk request tertentu browser mengirim <b>preflight</b> <code>OPTIONS</code> lebih dahulu. CORS bukan autentikasi dan bukan otorisasi; ia hanya mengatur apakah browser boleh membaca respons lintas origin.',
    'Bab ini mempraktikkan preflight dan respons CORS di lab, lalu memperluas ke ancaman HTTP yang sering muncul: CSRF, XSS, clickjacking, open redirect, SSRF, request smuggling, serta pertahanan dasar seperti security headers, rate limiting, dan batas ukuran request.'
  ],
  objectives: [
    'Menjelaskan same-origin policy dan kapan preflight dikirim browser',
    'Membaca header CORS dan mendiagnosis kesalahan origin atau credentials',
    'Mengenali CSRF, XSS, clickjacking, open redirect, dan SSRF pada tingkat konsep',
    'Menerapkan security headers, rate limit, validasi input, dan batas resource'
  ],
  sections: [
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 330" width="760" role="img" aria-label="Alur preflight CORS antara frontend dan API">
        <rect x="24" y="60" width="170" height="80" rx="10" class="u-box"/>
        <text x="109" y="90" class="u-title" text-anchor="middle">Frontend</text>
        <text x="109" y="113" class="u-lbl" text-anchor="middle">http://localhost:8123</text>

        <rect x="540" y="60" width="190" height="80" rx="10" class="u-hl"/>
        <text x="635" y="90" class="u-title" text-anchor="middle">API</text>
        <text x="635" y="113" class="u-lbl" text-anchor="middle">http://localhost:8787</text>

        <line x1="198" y1="84" x2="536" y2="84" class="u-line"/>
        <text x="367" y="74" class="u-lbl" text-anchor="middle">1 · OPTIONS + Origin + Access-Control-Request-Method</text>

        <line x1="536" y1="116" x2="198" y2="116" class="u-line"/>
        <text x="367" y="136" class="u-lbl" text-anchor="middle">2 · 204 + Allow-Origin + Allow-Methods + Allow-Headers</text>

        <line x1="198" y1="190" x2="536" y2="190" class="u-line"/>
        <text x="367" y="180" class="u-lbl" text-anchor="middle">3 · Request sebenarnya (POST + Origin)</text>

        <line x1="536" y1="222" x2="198" y2="222" class="u-line"/>
        <text x="367" y="242" class="u-lbl" text-anchor="middle">4 · Respons + Access-Control-Allow-Origin</text>

        <text x="380" y="296" class="u-lbl" text-anchor="middle">Jika origin tidak diizinkan, browser memblokir pembacaan respons di sisi client</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 13.1</b> — Preflight menanyakan izin sebelum request lintas origin yang “tidak sederhana” dikirim</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Simple Request dan Preflight</h3><p>Tidak semua request lintas origin memicu preflight. Browser menganggap request “sederhana” bila method-nya <code>GET</code>, <code>HEAD</code>, atau <code>POST</code>, dan header-nya terbatas pada header sederhana seperti <code>Accept</code>, <code>Content-Type</code> dengan nilai tertentu, dan <code>Accept-Language</code>. Di luar itu, browser mengirim <code>OPTIONS</code> lebih dahulu.</p><table><thead><tr><th>Header respons</th><th>Fungsi</th></tr></thead><tbody><tr><td><code>Access-Control-Allow-Origin</code></td><td>Origin yang diizinkan; harus spesifik bila memakai credentials.</td></tr><tr><td><code>Access-Control-Allow-Methods</code></td><td>Method yang diizinkan pada preflight.</td></tr><tr><td><code>Access-Control-Allow-Headers</code></td><td>Request header yang diizinkan.</td></tr><tr><td><code>Access-Control-Allow-Credentials</code></td><td>Mengizinkan cookie atau kredensial lintas origin.</td></tr><tr><td><code>Access-Control-Expose-Headers</code></td><td>Header respons yang boleh dibaca JavaScript.</td></tr><tr><td><code>Access-Control-Max-Age</code></td><td>Berapa lama hasil preflight boleh di-cache browser.</td></tr></tbody></table><p>Wildcard <code>*</code> tidak boleh dipakai bersama <code>Access-Control-Allow-Credentials: true</code>. Jika perlu cookie lintas origin, server harus menyebut origin secara spesifik dan mengirim <code>Vary: Origin</code> agar cache tidak salah menyajikan izin.</p>'
    },
    {
      type: 'text',
      html: '<h3>Kesalahan CORS yang Umum</h3><ul><li><b>Origin tidak cocok</b> — <code>http://localhost:3000</code> berbeda dari <code>http://127.0.0.1:3000</code>.</li><li><b>Preflight tidak menangani OPTIONS</b> — server hanya mendefinisikan GET/POST, sehingga preflight gagal.</li><li><b>Header tidak diizinkan</b> — client mengirim <code>Authorization</code> atau <code>Content-Type: application/json</code>, tetapi tidak ada di <code>Allow-Headers</code>.</li><li><b>Credentials tidak konsisten</b> — client memakai <code>credentials: &quot;include&quot;</code>, tetapi server mengirim wildcard atau tidak mengirim <code>Allow-Credentials</code>.</li><li><b>Mengandalkan CORS sebagai keamanan API</b> — curl dan aplikasi non-browser tidak tunduk pada CORS.</li></ul><p>Ingat: CORS dijalankan oleh browser. Server tetap harus memeriksa autentikasi dan otorisasi pada setiap request, termasuk yang datang dari curl.</p>'
    },
    {
      type: 'example',
      title: 'Menguji Preflight dan Respons CORS',
      lang: 'bash',
      output: false,
      code: `# Preflight dari origin yang diizinkan
curl -i -X OPTIONS http://localhost:8787/cors \\
  -H 'Origin: http://localhost:8123' \\
  -H 'Access-Control-Request-Method: POST' \\
  -H 'Access-Control-Request-Headers: Content-Type'

# Request biasa dengan Origin
curl -i http://localhost:8787/cors \\
  -H 'Origin: http://localhost:8123'

# Origin yang tidak diizinkan
curl -i http://localhost:8787/cors \\
  -H 'Origin: https://situs-tidak-dikenal.example'

# Perhatikan: curl tetap menerima body.
# Yang memblokir adalah browser, bukan curl.`,

      explain: [
        'Preflight yang berhasil membalas <code>204</code> dengan <code>Access-Control-Allow-Origin</code>, <code>Allow-Methods</code>, dan <code>Allow-Headers</code>.',
        'Untuk origin yang tidak ada di daftar, server tidak mengirim header izin. Browser akan memblokir pembacaan respons meskipun server tetap mengembalikan status dan body.',
        'Uji dengan curl berguna untuk memeriksa header, tetapi tidak mereproduksi keputusan browser. Gunakan DevTools untuk melihat pesan blokir CORS yang sebenarnya.'
      ]
    },
    {
      type: 'example',
      title: 'Open Redirect, Rate Limit, dan Ukuran Request',
      lang: 'bash',
      output: false,
      code: `# Redirect hanya ke path relatif; coba tujuan absolut
curl -i 'http://localhost:8787/redirect?to=/products'
curl -i 'http://localhost:8787/redirect?to=https://situs-lain.example'

# Rate limit: 5 request per 10 detik
for i in 1 2 3 4 5 6; do
  curl -s -o /dev/null -w "request $i: %{http_code}\\n" http://localhost:8787/rate
done

# Batas ukuran body: lebih dari 1 MiB ditolak
node -e "process.stdout.write('x'.repeat(1100000))" > besar.txt
curl -i -X POST http://localhost:8787/upload \\
  -H 'Content-Type: text/plain' \\
  --data-binary @besar.txt`,

      explain: [
        'Contoh redirect di lab hanya mengizinkan tujuan relatif agar tidak menjadi open redirect. Aplikasi nyata harus memvalidasi tujuan terhadap daftar domain yang diizinkan.',
        'Rate limit membalas <code>429</code> dengan <code>Retry-After</code>. Client yang baik menghormati header itu dan tidak mengulang secepat mungkin.',
        'Batas ukuran body melindungi memori dan disk. Server sebaiknya menolak lebih awal dan tidak membaca seluruh payload ke memori bila melewati batas.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Ancaman HTTP yang Perlu Dikenal</h3><table><thead><tr><th>Ancaman</th><th>Inti masalah</th><th>Mitigasi dasar</th></tr></thead><tbody><tr><td><b>XSS</b></td><td>Skrip penyerang berjalan di halaman tepercaya.</td><td>Escape output, CSP, hindari <code>innerHTML</code> dengan input mentah, cookie HttpOnly.</td></tr><tr><td><b>CSRF</b></td><td>Browser mengirim cookie atas nama pengguna ke aksi yang tidak diinginkan.</td><td>SameSite, CSRF token, verifikasi Origin, jangan ubah state lewat GET.</td></tr><tr><td><b>Clickjacking</b></td><td>Halaman jahat menampilkan situs lain di iframe transparan.</td><td><code>X-Frame-Options: DENY</code> atau CSP <code>frame-ancestors</code>.</td></tr><tr><td><b>Open redirect</b></td><td>URL tepercaya mengarahkan ke situs penyerang.</td><td>Validasi tujuan, gunakan allowlist, hindari parameter bebas.</td></tr><tr><td><b>SSRF</b></td><td>Server diminta mengakses alamat internal atas nama penyerang.</td><td>Validasi URL, blokir alamat privat, batasi egress.</td></tr><tr><td><b>Request smuggling</b></td><td>Perbedaan parsing antara proxy dan backend disalahgunakan.</td><td>Frontend/backend konsisten, batasi header ambigu, patch infrastruktur.</td></tr></tbody></table>'
    },
    {
      type: 'tip',
      title: 'Checklist Keamanan HTTP Singkat',
      text: 'Gunakan HTTPS, HSTS, <code>X-Content-Type-Options: nosniff</code>, <code>Content-Security-Policy</code>, <code>Referrer-Policy</code>, dan frame protection. Batasi ukuran body, waktu request, serta jumlah request. Validasi <code>Content-Type</code> dan input. Terapkan otorisasi di server untuk setiap endpoint, bukan hanya menyembunyikan tombol di UI.'
    },
    {
      type: 'warn',
      title: 'CORS Bukan Tembok API',
      text: 'Menambahkan header CORS tidak melindungi API dari client non-browser. Jika endpoint sensitif dapat diakses tanpa token yang valid, penyerang bisa memanggilnya dengan curl. CORS hanya mengatur izin baca di browser; autentikasi dan otorisasi tetap wajib di server.'
    },
    {
      type: 'vocab',
      items: [
        ['Origin', 'Kombinasi scheme, host, dan port yang menjadi identitas asal request.'],
        ['Same-origin policy', 'Kebijakan browser yang membatasi akses antar-origin.'],
        ['CORS', 'Mekanisme izin lintas origin melalui header respons dan preflight.'],
        ['Preflight', 'Request OPTIONS untuk menanyakan izin sebelum request lintas origin.'],
        ['CSRF', 'Serangan yang memaksa browser mengirim request berstate atas nama pengguna.'],
        ['XSS', 'Eksekusi skrip berbahaya di konteks halaman tepercaya.'],
        ['SSRF', 'Penyalahgunaan server untuk mengakses resource internal.'],
        ['Security header', 'Header respons yang membatasi perilaku browser dan mengurangi risiko.']
      ]
    }
  ],
  recap: [
    'Same-origin policy membatasi akses lintas origin; CORS memberi izin terkontrol melalui header dan preflight.',
    'Credentials lintas origin membutuhkan origin spesifik, Allow-Credentials, dan Vary: Origin; wildcard tidak cukup.',
    'CORS bukan autentikasi atau otorisasi, dan tidak melindungi API dari client non-browser.',
    'Keamanan HTTP membutuhkan kombinasi HTTPS, security headers, validasi input, batas resource, dan otorisasi server.'
  ]
});
