/* ============================================================
   Pelajaran Apache — 04: Directive, Context & Konfigurasi Modular
   ============================================================ */
'use strict';

window.APACHE_LESSONS = window.APACHE_LESSONS || [];

window.APACHE_LESSONS.push({
  id: 'directive-context-modular',
  title: 'Directive, Context, dan Konfigurasi Modular',
  chapter: 'Konfigurasi',
  duration: '10 menit',
  intro: [
    'Perintah Apache bukan daftar perintah bebas; setiap direktif punya <b>tempat yang sah</b> untuk ditulis. <code>RewriteRule</code> di luar blok tertentu akan ditolak, <code>Listen</code> di dalam VirtualHost tidak berarti, dan <code>Require</code> di tempat yang salah mengunci seluruh website. Memahami <b>konteks</b> adalah obat paling ampuh untuk pesan error <code>command not allowed here</code>.',
    'Pelajaran ini memetakan seluruh konteks dan aturan pewarisannya, lalu menunjukkan cara menyusun konfigurasi <b>modular</b>: file utama tipis, potongan di-Include per kebutuhan — persis pola yang dipakai lab bab ini.'
  ],
  objectives: [
    'Menyebutkan konteks utama Apache dan direktif yang sah di tiap konteks',
    'Menjelaskan aturan pewarisan dan penimpaan antar konteks',
    'Menguji konteks sebuah direktif melalui pesan error dan dokumentasi',
    'Menyusun konfigurasi modular memakai <code>Include</code> dan potongan snippets',
    'Menggunakan <code>httpd -S</code>, <code>httpd -M</code>, dan <code>httpd -l</code> untuk memeriksa konfigurasi'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Peta konteks</h3><p>Konteks menentukan cakupan direktif: seberapa luas ia berlaku dan dari mana ia mewarisi nilai.</p><table><thead><tr><th>Konteks</th><th>Cocok terhadap</th><th>Contoh direktif</th></tr></thead><tbody><tr><td><b>server</b> (global)</td><td>Seluruh proses</td><td><code>Listen</code>, <code>LoadModule</code>, <code>User</code>, <code>ServerTokens</code>, <code>LogFormat</code></td></tr><tr><td><b>virtual host</b></td><td>Peserta satu <code>&lt;VirtualHost&gt;</code></td><td><code>ServerName</code>, <code>DocumentRoot</code>, <code>SSLEngine</code>, <code>ProxyPass</code></td></tr><tr><td><b>directory</b></td><td>Path filesystem (<code>&lt;Directory&gt;</code>)</td><td><code>Options</code>, <code>AllowOverride</code>, <code>Require</code>, <code>ExpiresActive</code></td></tr><tr><td><b>location</b></td><td>Path URL (<code>&lt;Location&gt;</code>)</td><td><code>SetHandler</code>, <code>Require</code>, <code>LimitRequestBody</code>, <code>Header</code></td></tr><tr><td><b>.htaccess</b></td><td>Direktori ziarah per request</td><td>subset dari FileInfo/AuthConfig/Index/Limit</td></tr></tbody></table><p>Dua di antaranya sering tertukar: <code>&lt;Directory&gt;</code> memakai <b>path filesystem</b>, <code>&lt;Location&gt;</code> memakai <b>path URL</b>. Untuk URL yang di-rewrite atau di-proxy, keduanya bisa tidak sinkron — itulah alasan aturan proteksi yang kritis sebaiknya ditulis di <code>&lt;Directory&gt;</code>.</p>'
    },
    {
      type: 'example',
      title: 'Konteks yang salah memicu error yang jelas',
      lang: 'bash',
      output: true,
      code: `# Salah: Listen di dalam VirtualHost
<VirtualHost *:8080>
    Listen 8081
</VirtualHost>
# -> AH00519: Invalid command 'Listen' (mis-spelled?)

# Salah: RewriteRule tanpa RewriteEngine di konteks itu
<VirtualHost *:8080>
    RewriteRule ^/a$ /b [L]
</VirtualHost>
# -> AH00657: cannot rewrite without RewriteEngine on

# Benar: cek dulu dokumentasi kolom "Context"
podman exec apache-lab httpd -t`,
      explain: [
        'Pesan error hampir selalu menyebut direktif dan barisnya — baca pesan itu sebelum menebak-nebak.',
        'Beberapa direktif memang sengaja <b>hanya</b> global (mis. <code>Listen</code>) karena menyangkut resource proses, bukan satu website.',
        '<code>RewriteEngine On</code> diaktifkan per konteks; menyalakannya di server context tidak otomatis mengaktifkan blok rewrite di dalam <code>.htaccess</code> yang diizinkan.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Aturan pewarisan &amp; yang mana menang</h3><ol><li><b>Nilai mewarisi turun</b>: direktif di konteks induk dipakai oleh konteks anak yang tidak menimpanya sendiri.</li><li><b>Anak menimpa induk</b> untuk direktif yang sama (dengan catatan: directive <i>merging</i> ada yang menggabung, ada yang menimpa total).</li><li><b>Antar VirtualHost tidak saling mewarisi</b> — masing-masing turun dari konfigurasi server, lalu berhenti.</li><li><b>Antar Location tidak saling mewarisi</b>; namun direktif server tetap terlihat oleh tiap Location.</li><li><b>Peringkat urai</b> saat memperebutkan resource: <code>&lt;Directory&gt;</code> paling spesifik mengalahkan yang kurang spesifik; <code>&lt;Location&gt;</code> diproses <i>sesudah</i> mapping direktori.</li></ol><p>Konsekuensi praktis: <code>Options -Indexes</code> di <code>&lt;Directory&gt;</code> tidak "dikalahkan" oleh <code>&lt;Location&gt;</code> yang tidak menulis Options, tapi <code>SetHandler</code> di Location baru aktif setelah file/URL terpetakan.</p>'
    },
    {
      type: 'text',
      html: '<h3>Konfigurasi modular dengan Include</h3><p>Konfigurasi satu file sepanjang 2000 baris sulit dirawat dan rawan konflik. Pola yang dipakai lab ini (dan kebanyakan produksi) memecahnya menjadi potongan:</p><table><thead><tr><th>File</th><th>Isi</th><th>Dipakai oleh</th></tr></thead><tbody><tr><td><code>httpd.conf</code></td><td>Listen, modul, Directory global, log, balancer</td><td>proses</td></tr><tr><td><code>extra/app.conf</code></td><td>vhost utama + route statis/proxy</td><td>port 8080/8443/8081</td></tr><tr><td><code>extra/api.conf</code>, <code>extra/docs.conf</code></td><td>vhost lain</td><td>Host api.local / docs.local</td></tr><tr><td><code>snippets/proxy-routes.conf</code></td><td>ProxyPass &amp; LimitRequestBody</td><td>dua vhost (ditulis sekali)</td></tr><tr><td><code>snippets/security-headers.conf</code></td><td>Header keamanan</td><td>semua vhost</td></tr></tbody></table><pre><code># di httpd.conf — Include relatif dihitung dari ServerRoot\nInclude conf/extra/app.conf\nInclude conf/snippets/security-headers.conf</code></pre><p>Catatan penting: <b>Include diproses saat konfigurasi dibaca</b>, bukan saat request datang. Karena itu file yang disebut harus ada — typo nama file membuat <code>httpd -t</code> langsung gagal, bukan diam-diam dilewati.</p>'
    },
    {
      type: 'example',
      title: 'Tiga pemeriksaan konfigurasi yang wajib hafal',
      lang: 'bash',
      output: true,
      code: `# 1. Semua vhost & port + mana yang default
podman exec apache-lab httpd -S
# :8080
#     default vhost app.local /usr/local/apache2/conf/extra/app.conf:11
#     vhost api.local ... :8080
#     vhost docs.local ... :8080

# 2. Modul yang dimuat (LoadModule aktif)
podman exec apache-lab httpd -M | head -12
#  mpm_event_module (shared)
#  rewrite_module (shared)
#  ssl_module (shared)

# 3. Modul yang dikompilasi statis ke binari
podman exec apache-lab httpd -l
#  core.c  mod_so.c  http_core.c  mod_watchdog.c`,
      explain: [
        '<code>httpd -S</code> menampilkan seluruh pasangan IP:port → vhost beserta file asalnya; baris pertama pada suatu port adalah <b>default vhost</b>-nya.',
        '<code>httpd -M</code> adalah daftar yang harus dicek ketika sebuah direktif ternyata tidak dikenal — kemungkinan besar modulnya belum <code>LoadModule</code>.',
        '<code>httpd -l</code> hanya menampilkan modul statis; modul <code>.so</code> tidak muncul di sini sehingga jangan mencarinya di daftar itu.'
      ]
    },
    {
      type: 'warn',
      title: 'Snippets tidak bisa ditaruh sembarang tempat',
      text: '<p>Lab memasang <code>snippets/proxy-routes.conf</code> di <i>dalam</i> VirtualHost, bukan di file utama global. Alasannya: <code>ProxyPass</code> di konteks server berlaku untuk <b>semua</b> vhost — termasuk yang tidak boleh di-proxy. Begitu pun <code>&lt;Location&gt;</code> untuk <code>/server-status</code>: bila ditaruh global, seluruh website akan mengekspos status page. Aturan praktisnya: <b>konteks paling sempit yang memadai</b>.</p>'
    },
    {
      type: 'tip',
      title: 'Pola .htaccess: fleksibel, tapi bayar dengan I/O',
      text: '<p><code>.htaccess</code> beroperasi per direktori ziarah — Apache membacanya pada tiap request untuk tiap direktori yang dilewati. Untuk trafik besar, pindahkan aturan ke konfigurasi utama lalu set <code>AllowOverride None</code>. Keunggulannya nyata pada shared hosting: pemilik direktori bisa mengatur rewrite/autentikasi tanpa akses root. Di lab ini <code>AllowOverride All</code> di <code>htdocs</code> disiapkan untuk latihan .htaccess pada Pelajaran 07.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Context', 'Cakupan tempat sebuah direktif sah ditulis.'],
        ['Inheritance', 'Konteks anak memakai nilai direktif induk bila tidak menimpanya.'],
        ['Include', 'Menyisipkan file konfigurasi lain saat konfigurasi dibaca.'],
        ['Snippet', 'Potongan konfigurasi kecil yang dipakai ulang di banyak tempat.'],
        ['httpd -S', 'Inspeksi seluruh virtual host beserta default vhost tiap port.'],
        ['httpd -M', 'Daftar modul yang dimuat lewat LoadModule.'],
        ['httpd -l', 'Daftar modul yang dikompilasi statis ke binari httpd.'],
        ['Merging directive', 'Direktif yang nilai anaknya digabung (mis. LogFormat) bukan ditimpa total.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Jalankan <code>httpd -S</code> di lab dan identifikasi (a) default vhost port 8080, (b) vhost mana yang melayani 8443, (c) file mana yang memuatnya.</li><li>Pindahkan <code>Include conf/snippets/security-headers.conf</code> dari vhost ke bagian global httpd.conf, jalankan <code>httpd -t</code>, lalu pikirkan: apa yang berbeda pada vhost yang tidak kamu ubah?</li><li>Tulis <code>RewriteRule</code> tanpa <code>RewriteEngine On</code> pada potongan lab, buktikan pesan errornya, lalu perbaiki. Catat nomor baris yang disebut pesan error.</li><li>Jelaskan kenapa <code>&lt;Location "/server-status"&gt;</code> lebih tepat daripada <code>&lt;Directory&gt;</code> untuk membatasi endpoint yang tidak punya file fisik.</li></ol>'
    }
  ],
  recap: [
    'Tiap direktif punya konteks sah: server, virtual host, directory, location, atau .htaccess — di luar itu <code>httpd -t</code> menolak.',
    'Pewarisan: anak mewarisi dan menimpa induk; antar VirtualHost dan antar Location tidak saling mewarisi.',
    'Konfigurasi modular = file utama tipis + <code>Include</code> potongan; pilih konteks paling sempit agar aturan tidak melebar ke website lain.',
    '<code>httpd -S</code> (vhost), <code>httpd -M</code> (modul dimuat), <code>httpd -l</code> (modul statis) adalah alat inspeksi konfigurasi.'
  ]
});
