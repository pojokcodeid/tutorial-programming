/* ============================================================
   Pelajaran HTTP — Bab 9: Cookie dan Session
   ============================================================ */
'use strict';

window.HTTP_LESSONS = window.HTTP_LESSONS || [];

window.HTTP_LESSONS.push({
  id: 'cookie-session',
  title: 'Cookie dan Session',
  chapter: 'State & Keamanan',
  duration: '13–15 menit',
  intro: [
    'HTTP tidak mengingat request sebelumnya. Namun saat kamu login, halaman berikutnya tetap mengenalimu. Jembatannya adalah <b>cookie</b>: potongan data kecil yang dikirim server melalui <code>Set-Cookie</code>, disimpan browser, lalu dikirim kembali pada request berikutnya melalui header <code>Cookie</code>.',
    'Cookie sering dipakai untuk <b>session</b>. Server menyimpan data sesi (misalnya user ID dan waktu kedaluwarsa), sedangkan browser hanya memegang identifier sesi. Identifier itu harus dilindungi: jika bocor, orang lain bisa mencoba memakainya.',
    'Bab ini membedah atribut cookie yang paling penting — <code>Secure</code>, <code>HttpOnly</code>, <code>SameSite</code>, <code>Path</code>, <code>Domain</code>, <code>Expires</code>, dan <code>Max-Age</code> — lalu mempraktikkannya dengan cookie jar curl. Kita juga akan membandingkan session berbasis server dengan token.'
  ],
  objectives: [
    'Menjelaskan alur Set-Cookie dan Cookie pada request berikutnya',
    'Memilih atribut cookie sesuai kebutuhan keamanan dan cakupan',
    'Mempraktikkan login, profil, dan logout memakai cookie jar curl',
    'Membedakan session berbasis server dengan autentikasi berbasis token'
  ],
  sections: [
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 320" width="760" role="img" aria-label="Alur cookie sesi dari login sampai request profil berikutnya">
        <rect x="24" y="50" width="160" height="80" rx="10" class="u-box"/>
        <text x="104" y="80" class="u-title" text-anchor="middle">Browser</text>
        <text x="104" y="103" class="u-lbl" text-anchor="middle">penyimpan cookie</text>

        <line x1="188" y1="90" x2="300" y2="90" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="244" y="76" class="u-lbl" text-anchor="middle">1 · POST /login</text>

        <rect x="304" y="50" width="180" height="80" rx="10" class="u-hl"/>
        <text x="394" y="80" class="u-title" text-anchor="middle">Server</text>
        <text x="394" y="103" class="u-lbl" text-anchor="middle">buat session id</text>

        <line x1="300" y1="130" x2="188" y2="130" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="244" y="150" class="u-lbl" text-anchor="middle">2 · Set-Cookie: sid=...</text>

        <rect x="430" y="196" width="200" height="80" rx="10" class="u-box"/>
        <text x="530" y="226" class="u-title" text-anchor="middle">Session Store</text>
        <text x="530" y="249" class="u-lbl" text-anchor="middle">sid → user, expiry</text>
        <line x1="486" y1="130" x2="514" y2="192" class="u-line" marker-end="url(#u-arrow)"/>

        <line x1="188" y1="235" x2="300" y2="235" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="244" y="221" class="u-lbl" text-anchor="middle">3 · GET /profile</text>
        <text x="244" y="255" class="u-lbl" text-anchor="middle">Cookie: sid=...</text>

        <text x="380" y="300" class="u-lbl" text-anchor="middle">Server mencari sid, lalu mengembalikan data pengguna tanpa mengirim password lagi</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 9.1</b> — Session: browser menyimpan identifier, server menyimpan data sesi</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Atribut Cookie yang Penting</h3><table><thead><tr><th>Atribut</th><th>Fungsi</th></tr></thead><tbody><tr><td><code>Secure</code></td><td>Cookie hanya dikirim melalui HTTPS.</td></tr><tr><td><code>HttpOnly</code></td><td>Cookie tidak dapat dibaca JavaScript, mengurangi dampak XSS terhadap pencurian sesi.</td></tr><tr><td><code>SameSite</code></td><td>Mengatur pengiriman cookie pada request lintas situs: <code>Strict</code>, <code>Lax</code>, atau <code>None</code>.</td></tr><tr><td><code>Path</code></td><td>Membatasi path yang menerima cookie.</td></tr><tr><td><code>Domain</code></td><td>Memperluas cakupan ke subdomain tertentu; hati-hati efeknya.</td></tr><tr><td><code>Expires</code></td><td>Waktu kedaluwarsa absolut.</td></tr><tr><td><code>Max-Age</code></td><td>Umur cookie dalam detik; lebih mudah dipakai untuk sesi.</td></tr></tbody></table><p><code>HttpOnly</code> tidak menghilangkan seluruh risiko XSS, dan <code>SameSite</code> bukan pengganti CSRF token. Keduanya adalah lapisan pertahanan yang harus dipakai bersama kontrol lain.</p>'
    },
    {
      type: 'example',
      title: 'Login dan Simpan Cookie dengan curl',
      lang: 'bash',
      output: false,
      code: `# -c menyimpan cookie ke berkas
curl -i -c cookies.txt -X POST http://localhost:8787/login \\
  -H 'Content-Type: application/json' \\
  -d '{"username":"nina","password":"rahasia123"}'

# Lihat isi cookie jar (jangan bagikan berkas ini)
cat cookies.txt

# -b mengirim cookie dari berkas
curl -i -b cookies.txt http://localhost:8787/profile

# Logout menghapus sesi dan cookie
curl -i -b cookies.txt -X POST http://localhost:8787/logout

# Setelah logout, profil harus 401
curl -i -b cookies.txt http://localhost:8787/profile`,
      explain: [
        'Opsi <code>-c</code> menyimpan cookie yang diterima ke berkas, sedangkan <code>-b</code> mengirimkannya kembali pada request berikutnya.',
        'Pada respons login, cari header <code>Set-Cookie</code>. Atribut <code>HttpOnly</code> dan <code>SameSite=Lax</code> menunjukkan cookie tidak dapat dibaca JavaScript dan dibatasi pada navigasi lintas situs.',
        'Setelah logout, sesi di server dihapus. Cookie yang masih tersimpan di browser tidak lagi berguna karena identifier-nya sudah tidak valid.'
      ]
    },
    {
      type: 'example',
      title: 'Melihat Cookie di Browser',
      lang: 'text',
      output: false,
      code: `1. Buka http://localhost:8787/ lalu login lewat curl atau
   lakukan request login dari client yang kamu buat.
2. Buka DevTools → Application → Cookies → localhost:8787.
3. Perhatikan kolom Name, Value, HttpOnly, Secure, SameSite,
   Path, dan Expires/Max-Age.
4. Hapus cookie, lalu muat ulang /profile.
   Hasilnya seharusnya 401 karena sesi tidak lagi dikirim.`,
      explain: [
        'DevTools memperlihatkan atribut cookie yang tidak selalu terlihat di response header mentah.',
        'Cookie tanpa <code>Secure</code> bisa terkirim lewat HTTP. Di produksi, cookie sesi harus memakai HTTPS dan atribut <code>Secure</code>.',
        'Cookie dengan <code>Path=/admin</code> hanya dikirim ke path tersebut, sehingga cakupannya lebih sempit.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Session Server vs Token</h3><p><b>Session server</b> menyimpan state di server. Browser hanya memegang identifier. Kelebihannya: server bisa mencabut sesi seketika dan data sensitif tidak berada di client. Kekurangannya: server perlu tempat penyimpanan bersama jika memiliki banyak instance.</p><p><b>Token</b>, misalnya bearer token atau JWT, dibawa client pada setiap request. Token bisa diverifikasi tanpa lookup session, tetapi pencabutan lebih rumit dan token yang bocor berlaku sampai kedaluwarsa. Banyak aplikasi memakai kombinasi: access token berumur pendek dan refresh token yang disimpan aman.</p>'
    },
    {
      type: 'tip',
      title: 'Praktik Langsung',
      text: 'Jalankan login dengan <code>-c cookies.txt</code>, lalu buka <code>/profile</code> dengan <code>-b cookies.txt</code>. Hapus file cookie dan ulangi: hasilnya 401. Setelah itu login lagi, logout, dan pastikan token lama tidak bisa dipakai. Catat header <code>Set-Cookie</code> dan bandingkan atributnya.'
    },
    {
      type: 'warn',
      title: 'Cookie Sesi Harus Dilindungi',
      text: 'Jangan menyimpan cookie sesi di URL, jangan mencatat nilai cookie di log, dan jangan memakai <code>SameSite=None</code> tanpa <code>Secure</code>. Untuk aplikasi produksi, gunakan HTTPS, rotasi sesi setelah login, dan mekanisme pencabutan saat logout.'
    },
    {
      type: 'vocab',
      items: [
        ['Cookie', 'Data kecil yang disimpan browser dan dikirim kembali ke server pada request berikutnya.'],
        ['Set-Cookie', 'Header response yang meminta browser menyimpan cookie.'],
        ['HttpOnly', 'Atribut yang mencegah JavaScript membaca cookie.'],
        ['SameSite', 'Atribut yang mengatur pengiriman cookie pada request lintas situs.'],
        ['Session', 'State login yang disimpan di server dan diidentifikasi oleh cookie atau token.'],
        ['Cookie jar', 'Penyimpanan cookie pada client, termasuk berkas yang dipakai curl.'],
        ['Max-Age', 'Umur cookie dalam detik sebelum dihapus browser.']
      ]
    }
  ],
  recap: [
    'Cookie menjembatani HTTP stateless dengan menyimpan identifier yang dikirim kembali pada request berikutnya.',
    'Atribut Secure, HttpOnly, SameSite, Path, Domain, dan Max-Age menentukan keamanan serta cakupan cookie.',
    'Session server menyimpan data di server; token membawa bukti identitas di client dan punya trade-off berbeda.',
    'Logout yang benar harus mencabut sesi di server, bukan hanya menghapus cookie di browser.'
  ]
});
