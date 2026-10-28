/* ============================================================
   Pelajaran Micro-Frontend — Bab 19: Keamanan, Aksesibilitas,
   dan Tata Kelola
   ============================================================ */
'use strict';

window.MICROFRONTEND_LESSONS = window.MICROFRONTEND_LESSONS || [];

window.MICROFRONTEND_LESSONS.push({
  id: 'mf-governance',
  title: 'Keamanan, Aksesibilitas, dan Tata Kelola',
  chapter: 'Produksi & Evolusi',
  duration: '20 menit',
  intro: [
    'Setiap remote yang dimuat shell adalah kode pihak lain yang berjalan di halamanmu. Ia bisa membaca DOM, memanggil API dengan sesi pengguna, dan mengirim data ke mana pun. Batas kepemilikan tim bukan batas keamanan browser.',
    'Bab ini membahas header keamanan, CSP, SRI, CORS, supply chain, token, dan XSS. Setelah itu kita beralih ke aksesibilitas lintas remote: siapa yang mengatur fokus, heading, landmark, dan judul halaman ketika rute berganti.',
    'Terakhir, kita menyusun tata kelola yang membuat keputusan tidak bergantung pada ingatan satu orang: design token, versi kontrak, RFC/ADR, kebijakan dependensi, dan on-call. Praktiknya adalah audit satu remote dengan checklist aksesibilitas dan header keamanan.'
  ],
  objectives: [
    'Menyusun CSP dan header keamanan untuk shell serta remote',
    'Menjelaskan peran SRI, CORS, dan pengamanan supply chain',
    'Menangani token dan risiko XSS pada batas remote',
    'Mengaudit aksesibilitas lintas remote secara terukur',
    'Menjalankan tata kelola: design token, versi kontrak, RFC/ADR, dan on-call'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Remote adalah Kode yang Kamu Percayai</h3><p>Module Federation memuat <code>remoteEntry.js</code> dari origin lain, lalu mengeksekusinya di dokumen shell. CORS hanya mengatur siapa yang boleh membaca respons; CORS tidak membuat kode remote menjadi sandbox. Setelah dimuat, remote berjalan dengan hak yang sama seperti kode shell: ia bisa membaca DOM, memanggil <code>fetch</code>, dan mengakses token yang ada di memori.</p><p>Karena itu, keamanan micro-frontend adalah kombinasi <b>kepercayaan pada pemasok</b> dan <b>pembatasan dampak</b>. Kamu perlu tahu siapa yang boleh merilis remote, dari origin mana, dengan dependensi apa, dan bagaimana membuktikan artefak itu tidak berubah di perjalanan.</p><p>Model ancaman sederhananya: manifest bisa dimanipulasi, remoteEntry bisa diganti, dependensi bisa disusupi, dan input pengguna bisa menjadi XSS. Setiap lapisan membutuhkan kontrol sendiri.</p>'
    },
    {
      type: 'example',
      title: 'Header keamanan dan CORS yang membatasi origin',
      lang: 'js',
      output: false,
      code: `const CSP = [
  "default-src 'self'",
  "script-src 'self' http://localhost:4174 http://localhost:4175 http://localhost:4176 http://localhost:4177",
  "style-src 'self' 'unsafe-inline' http://localhost:4174 http://localhost:4175 http://localhost:4176 http://localhost:4177",
  "img-src 'self' data:",
  "connect-src 'self' http://localhost:4173",
  "frame-src http://localhost:4178",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'"
].join('; ');

response.setHeader('Content-Security-Policy', CSP);
response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
response.setHeader('X-Content-Type-Options', 'nosniff');
response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

const ALLOWED = new Set([
  'http://localhost:4173',
  'http://localhost:4178' // legacy memanggil API produk lintas origin
]);
const origin = request.headers.origin;
if (origin && ALLOWED.has(origin)) {
  response.setHeader('Access-Control-Allow-Origin', origin);
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Vary', 'Origin');
}`,
      explain: [
        'CSP membatasi dari mana script boleh dimuat. Daftarkan origin remote yang benar-benar disetujui; jangan memakai <code>*</code> hanya agar semuanya cepat jalan.',
        'CORS harus memakai allowlist dan <code>Vary: Origin</code>. Kode di proyek contoh memantulkan origin apa pun; itu memudahkan demo, tetapi bukan konfigurasi produksi.',
        'HSTS, <code>nosniff</code>, Referrer-Policy, dan Permissions-Policy mengurangi kelas serangan yang tidak berhubungan langsung dengan federasi, tetapi tetap penting untuk shell.'
      ]
    },
    {
      type: 'text',
      html: '<h3>SRI dan Supply Chain</h3><p><b>Subresource Integrity</b> (SRI) memastikan berkas yang dimuat browser memiliki hash yang diharapkan. Untuk aset statis milik shell, ini mudah: tambahkan <code>integrity</code> dan <code>crossorigin="anonymous"</code> pada tag script atau link. Untuk <code>remoteEntry.js</code> yang dimuat dinamis lewat Module Federation, SRI tidak bisa dipasang sebagai atribut biasa karena URL dan graf modulnya berubah saat runtime.</p><p>Karena itu, lindungi supply chain di lapisan lain: sajikan remote hanya lewat HTTPS, tanda tangani manifest atau artefak (misalnya dengan cosign/Sigstore), kunci versi di manifest, batasi origin di CSP, dan verifikasi hash artefak di pipeline sebelum manifest diperbarui. Lockfile, <code>npm audit</code>, dependency allowlist, dan review pemilik paket melengkapi kontrol ini.</p><p>Jangan mengklaim SRI selesai hanya karena shell punya satu tag <code>integrity</code>. Yang dilindungi tag itu adalah berkas shell, bukan seluruh remote yang dimuat kemudian.</p>'
    },
    {
      type: 'text',
      html: '<h3>Token dan XSS di Batas Remote</h3><p>TokoMicro menyimpan access token di memori shell dan refresh token di cookie <code>httpOnly</code> + <code>SameSite=Lax</code>. Remote tidak menyimpan salinan sesi; ia meminta token segar lewat <code>ctx.getToken()</code>. Pola ini mengurangi paparan token terhadap <code>localStorage</code> dan skrip pihak ketiga.</p><p>Aturan yang perlu dipegang:</p><ul><li>Jangan menaruh token di query string, URL iframe, atau <code>postMessage</code> tanpa target origin.</li><li>Jangan membaca cookie <code>httpOnly</code> dari JavaScript; itu memang tujuannya.</li><li>Validasi <code>event.origin</code> pada setiap pesan lintas jendela dan batasi <code>targetOrigin</code>.</li><li>React meng-escape teks secara default, tetapi <code>dangerouslySetInnerHTML</code>, markdown, dan deskripsi produk dari server tetap perlu sanitasi.</li><li>Aktifkan Trusted Types bila browser mendukung, dan jangan mematikan CSP hanya karena satu pustaka lama.</li></ul><p>Ingat: remote yang disusupi dapat membaca token dari memori shell. Kontrol terkuatnya bukan hanya CSP, tetapi juga seleksi pemasok, review kode, dan pembatasan siapa yang boleh merilis.</p>'
    },
    {
      type: 'text',
      html: '<h3>Aksesibilitas Lintas Remote</h3><p>Pengguna tidak tahu ada empat tim di balik halaman. Mereka hanya merasakan satu dokumen. Karena itu, tanggung jawab aksesibilitas dibagi: <b>shell</b> memiliki judul dokumen, fokus setelah navigasi, skip link, landmark utama, dan pengumuman rute; <b>remote</b> memiliki struktur heading, label form, kontras, dan interaksi di dalam slotnya.</p><p>Checklist minimum:</p><ul><li>Satu <code>h1</code> per halaman dan urutan heading tidak melompat.</li><li>Fokus terlihat jelas dan dipindahkan ke awal konten setelah rute berubah.</li><li>Iframe memiliki <code>title</code> yang menjelaskan isinya.</li><li>Form punya label, pesan error terhubung lewat <code>aria-describedby</code>, dan status diumumkan lewat <code>aria-live</code>.</li><li>Kontras teks minimal 4.5:1; focus ring memakai token, bukan warna yang mudah hilang.</li><li>Semua alur dapat diselesaikan dengan keyboard, tanpa keyboard trap.</li></ul><p>Uji dengan keyboard dan pembaca layar, bukan hanya Lighthouse. Skor otomatis tidak menangkap urutan fokus yang membingungkan.</p>'
    },
    {
      type: 'example',
      title: 'Praktik: audit header dan aksesibilitas satu remote',
      lang: 'bash',
      output: false,
      code: `cd examples/micro-frontend-react
npm run build && npm start

# 1. Header shell
curl -sI http://localhost:4173/ | grep -iE 'content-security-policy|strict-transport|x-content-type|referrer-policy|permissions-policy'

# 2. Header remote produk
curl -sI http://localhost:4175/assets/remoteEntry.js | grep -iE 'access-control-allow-origin|cache-control'

# 3. Ringkasan header lewat Node
node -e "fetch('http://localhost:4173/').then(async r => { console.log(r.status); for (const [k, v] of r.headers) if (/security|policy|referrer/i.test(k)) console.log(k + ': ' + v); })"

# 4. Audit manual di browser
#    - Tab melalui header, katalog, keranjang, akun: fokus terlihat?
#    - Satu h1, landmark main/nav, iframe punya title?
#    - Lighthouse Accessibility pada /katalog, /keranjang, /akun
#    - Zoom 200% dan viewport 390 px: tidak ada konten terpotong?
#    - Selesaikan tambah produk dan checkout hanya dengan keyboard.`,
      explain: [
        'Catat temuan sebagai bukti, bukan opini: URL, header yang hilang, skor, langkah reproduksi, dampak, pemilik, dan tenggat.',
        'Di proyek contoh, header CSP/HSTS memang belum ada dan CORS memantulkan origin. Temuan itu nyata; perbaiki di server atau edge, lalu ulangi perintah yang sama untuk membandingkan.',
        'Audit aksesibilitas harus mencakup minimal satu alur lintas remote, misalnya katalog → keranjang → login → checkout, karena masalah fokus sering muncul saat batas remote dilewati.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Tata Kelola dan Checkpoint Audit</h3><p>Tata kelola bukan birokrasi. Ia adalah cara membuat keputusan tetap konsisten ketika orang berganti. Beberapa mekanisme yang layak dimiliki:</p><table class="vocab"><tr><th>Area</th><th>Mekanisme</th></tr><tr><td>Keputusan arsitektur</td><td>ADR singkat: konteks, keputusan, konsekuensi, alternatif.</td></tr><tr><td>Perubahan lintas tim</td><td>RFC dengan masa komentar dan pemilik keputusan yang jelas.</td></tr><tr><td>Desain</td><td>Design system + token <code>--tm-*</code>, bukan warna hard-coded per remote.</td></tr><tr><td>Kontrak</td><td>Semver, masa deprecation, dan review pemilik paket kontrak.</td></tr><tr><td>Dependensi</td><td>Allowlist, lockfile, audit, jadwal pembaruan, dan review lisensi.</td></tr><tr><td>Operasi</td><td>On-call per remote, runbook, severity, dan postmortem tanpa menyalahkan orang.</td></tr></table><p><b>Checkpoint audit:</b> simpan hasil <code>curl</code> sebelum dan sesudah perbaikan; buktikan CSP tidak memblokir remote yang sah; ulangi Lighthouse dan catat skor; pastikan setiap temuan punya tiket dan pemilik. Audit selesai ketika temuan tinggi sudah diperbaiki atau diterima secara tertulis dengan risiko yang dipahami.</p>'
    },
    {
      type: 'warn',
      title: 'Jangan Memantulkan Origin Apa Pun Saat Memakai Cookie',
      text: '<code>Access-Control-Allow-Origin: *</code> tidak boleh dipakai bersama <code>Access-Control-Allow-Credentials: true</code>. Memantulkan nilai <code>Origin</code> tanpa allowlist sama berbahayanya: situs mana pun dapat memanggil API dengan cookie pengguna. Gunakan daftar origin yang disetujui, kirim <code>Vary: Origin</code>, dan pertimbangkan <code>SameSite</code> yang tepat. Jangan menambal masalah dengan menaruh token di URL; itu justru menambah kebocoran lewat log, riwayat, dan referrer.'
    },
    {
      type: 'vocab',
      items: [
        ['CSP', 'Content Security Policy: aturan browser tentang sumber script, gaya, gambar, frame, dan koneksi.'],
        ['SRI', 'Subresource Integrity: hash yang memastikan berkas yang dimuat tidak berubah.'],
        ['CORS', 'Aturan browser untuk permintaan lintas origin, termasuk izin kredensial.'],
        ['Supply chain', 'Rantai pemasok kode dan dependensi dari repositori sampai browser pengguna.'],
        ['XSS', 'Cross-site scripting: eksekusi skrip penyerang di halaman pengguna.'],
        ['Trusted Types', 'API browser yang membatasi pembuatan HTML berbahaya dari string.'],
        ['WCAG', 'Pedoman aksesibilitas web yang menjadi acuan kontras, fokus, dan struktur.'],
        ['ADR', 'Architectural Decision Record: catatan keputusan arsitektur dan konsekuensinya.'],
        ['On-call', 'Giliran tim menangani insiden dan pertanyaan operasional untuk layanannya.'],
        ['Threat model', 'Daftar aset, pelaku, jalur serangan, dan kontrol yang direncanakan.']
      ]
    }
  ],
  recap: [
    'Remote berjalan dengan hak shell; CORS bukan sandbox dan CSP bukan pengganti kepercayaan pada pemasok.',
    'CSP, CORS allowlist, HSTS, dan header lain membatasi dampak, sedangkan SRI dan tanda tangan artefak melindungi integritas.',
    'Token tetap di memori shell dan cookie httpOnly; remote meminta lewat ctx.getToken, bukan menyalin sesi.',
    'Aksesibilitas dibagi: shell mengatur fokus dan judul dokumen, remote menjaga heading, label, dan kontras di slotnya.',
    'Tata kelola yang baik menghasilkan keputusan tertulis, kontrak berversi, dependency policy, dan on-call yang jelas.'
  ]
});
