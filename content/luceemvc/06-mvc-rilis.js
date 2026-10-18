/* ============================================================
   Pelajaran Lucee CFML — Bab 26: Rilis & Pengujian (L26)
   ============================================================ */
'use strict';

window.LUCEE_LESSONS = window.LUCEE_LESSONS || [];

window.LUCEE_LESSONS.push({
  id: 'lucee-mvc-rilis',
  title: 'Pengujian Route, Troubleshooting & Rilis',
  chapter: 'Proyek Praktis: Framework MVC',
  duration: '14 menit',
  intro: [
    'Seluruh bagian framework sudah terpasang. Pelajaran penutup ini menyalakannya dari nol — menyiapkan database, menjalankan server, menguji tiap route — lalu membahas cara menghadapi masalah umum (rewrite tidak jalan, .env tidak terbaca, controller tidak ditemukan) dan membawa framework ke produksi.',
    'Hasil akhirnya adalah kerangka yang bisa kamu gandakan: cukup tulis model, controller, view, dan daftarkan route — modul baru bisa lahir dalam hitungan menit.'
  ],
  objectives: [
    'Menyiapkan database dan menjalankan migrasi skema',
    'Menjalankan framework dari nol dengan box server start',
    'Menggunakan file .http untuk menguji seluruh route',
    'Mendiagnosis masalah umum: rewrite, .env, controller, dan session',
    'Menerapkan checklist sebelum rilis produksi',
    'Memperluas framework dengan modul baru secara sistematis'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Menjalankan dari Nol</h3><p>Urutan setup proyek contoh ini — dari clone sampai halaman pertama tampil — bisa dihafalkan sebagai ritual awal setiap pengembangan framework-mu.</p>'
    },
    {
      type: 'example',
      title: 'Setup lengkap dalam lima perintah',
      lang: 'bash',
      output: false,
      code: `# 1. Salin konfigurasi lalu sesuaikan kredensial DB
cp .env.example .env

# 2. Buat database & jalankan migrasi
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS latihan"
mysql -u root -p latihan < migrations/001_init.sql

# 3. Nyalakan server Lucee (webroot: src, port 8888)
box server start

# 4. Buka aplikasi
open http://localhost:8888/employee

# 5. Setelah mengubah .env — baca ulang konfigurasi
box server restart`,
      explain: [
        'Perintah <code>mysql ... &lt; migrations/001_init.sql</code> mengeksekusi file skema sebagai satu rangkaian — idempoten berkat <code>CREATE TABLE IF NOT EXISTS</code>.',
        '<code>box server start</code> membaca <code>server.json</code>: mengunduh Lucee 7 bila perlu, menyetel webroot src, lalu mengaktifkan rewrite.',
        'Bila CommandBox belum terpasang: <code>brew install commandbox</code> (macOS) atau unduh dari ortussolutions.com.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Menguji Route dengan File .http</h3><p>File <code>.http</code> adalah cara paling efisien menguji endpoint: request tersimpan sebagai teks yang bisa dijalankan satu per satu dari VS Code (ekstensi REST Client) atau JetBrains HTTP Client. Bagi route HTML, uji dengan browser; bagi route JSON dan aksi POST, file .http jauh lebih cepat daripada form manual.</p>'
    },
    {
      type: 'example',
      title: 'tests/employee_test.http',
      lang: 'http',
      output: false,
      code: `### Uji endpoint say-hay (respons JSON)
GET http://localhost:8888/employee/say-hay

### Daftar semua employee (halaman HTML)
GET http://localhost:8888/employee

### Tambah employee lewat JSON body
POST http://localhost:8888/employee
Content-Type: application/json

{
    "name": "Pojok Code",
    "email": "info@pojokcode.id",
    "age": 30
}

### Ambil satu employee (id=1)
GET http://localhost:8888/employee/edit/1

### Hapus employee (id=1)
GET http://localhost:8888/employee/delete/1`,
      explain: [
        'Blok <code>###</code> memisahkan antar request — setiap blok bisa dijalankan terpisah.',
        'Header <code>Content-Type: application/json</code> membuat router meng-parse body sebagai argument <code>content</code>.',
        'Jalankan urut dari atas: say-hay menguji pipeline rewrite tanpa database, sehingga error pertama langsung terlokalisir.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Troubleshooting: Masalah Umum</h3><p>Pengalaman menunjukkan empat sumber kegagalan paling sering saat framework MVC CFML baru dipasang. Daftar berikut bisa dicetak dan ditempel di dinding — setiap gejala langsung menuju penyebabnya.</p>'
    },
    {
      type: 'example',
      title: 'Tabel gejala → penyebab → solusi',
      lang: 'text',
      output: false,
      code: `Gejala                          Penyebab                Solusi
─────────────────────────────────────────────────────────────────────
URL bersih 404, tapi            rewrite belum aktif     cek "rewrites.enable"
/index.cfm?page=... jalan                                 di server.json; restart

"File .env tidak ditemukan"     .env belum dibuat /     cp .env.example .env;
                                salah lokasi            taruh di root proyek

Controller 'X' not found        nama tidak cocok /      cek nama file & path
                                method private          di core/Router.cfc

Halaman tampil tapi data        datasource salah /      cek DB_* di .env,
kosong / query error            database belum ada       pastikan migrasi jalan

Sesi hilang tiap request        sessionManagement       this.sessionManagement
                                tidak aktif             = true di Application.cfc`,
      explain: [
        'Urutan diagnosis selalu sama: buka <code>/index.cfm?page=employee</code> langsung — bila berarti rewrite yang bermasalah, bukan kode aplikasi.',
        'Log error framework tersimpan di folder <code>logs/</code> root proyek dengan nama UUID — buka file terbaru untuk melihat dump exception lengkap.',
        '<code>box server log</code> menampilkan log server CommandBox bila masalah terjadi sebelum CFML berjalan.'
      ]
    },
    {
      type: 'warn',
      title: 'Debug hanya untuk pengembangan',
      text: 'Tabel di atas mengasumsikan <code>APP_DEBUG=true</code> yang menampilkan dump exception lengkap di browser. Di produksi, set <code>APP_DEBUG=false</code> — cukup tampilkan reference ID (UUID) yang cocok dengan file log di server. Detail exception di publik membocorkan struktur database dan jalur file kepada penyerang.'
    },
    {
      type: 'text',
      html: '<h3>Membawa ke Produksi</h3><p>Checklist rilis untuk framework ini ringkas karena semua konfigurasi sudah terpusat di .env:</p><ul><li><b>.env produksi</b> — salin .env.example ke server produksi, isi kredensial database produksi, <code>APP_DEBUG=false</code>, dan <code>APP_URL</code> sesuai domain publik.</li><li><b>Rewrite di web server</b> — pasang aturan rewrite serupa di Tomcat (Tuckey) atau Nginx (<code>location /</code> → <code>index.cfm?page=$uri</code>), termasuk pengecualian <code>/public/</code>.</li><li><b>Folder uploads</b> — pastikan <code>src/public/uploads/</code> writable oleh user server, dan pertimbangkan memindahkannya ke storage terpisah bila file penting.</li><li><b>HTTPS</b> — pasang TLS di depan Lucee (Nginx/reverse proxy) dan set <code>APP_URL=https://...</code> agar semua link memakai https.</li><li><b>Log & backup</b> — arsipkan folder <code>logs/</code> dan jadwalkan backup database rutin.</li></ul>'
    },
    {
      type: 'text',
      html: '<h3>Modul Berikutnya</h3><p>Framework siap tumbuh. Urutan pengembangan yang terbukti efektif: tambahkan modul CRUD baru dengan meniru pola Employee — model, controller, view, lalu daftarkan routenya. Setelah nyaman, naikkan level: autentikasi session-based dengan middleware login di <code>onRequestStart()</code>, pagination di model, CSRF token pada form, hingga halaman error custom. Setiap fitur memakai potongan framework yang sudah ada — tidak ada yang perlu ditulis ulang.</p>'
    },
    {
      type: 'tip',
      title: 'Jadikan core/ sebagai paket terpisah',
      text: 'Bila framework sudah stabil, pindahkan folder <code>core/</code> ke repositori sendiri dan pasang ke tiap proyek lewat CommandBox dependencies (<code>box install nama-paket@^1</code>). Begitulah framework kecil berevolusi menjadi paket yang dipakai berulang di banyak proyek — persis jalannya ColdBox dan ForgeBox di ekosistem CFML.'
    },
    {
      type: 'vocab',
      items: [
        ['.http', 'File teks berisi request HTTP yang bisa dijalankan dari editor (REST Client) untuk pengujian endpoint.'],
        ['APP_DEBUG', 'Kunci .env yang mengendalikan apakah detail exception tampil di browser.'],
        ['Reference ID', 'UUID yang ditampilkan halaman error produksi dan cocok dengan file log di server.'],
        ['Migrasi', 'File SQL berurutan yang menerapkan perubahan skema database secara terkontrol.'],
        ['Writable', 'Izin file system: folder upload harus bisa ditulis oleh user yang menjalankan server.'],
        ['Middleware', 'Lapisan yang berjalan sebelum controller (mis. cek login) dan bisa memblokir request.']
      ]
    }
  ],
  recap: [
    'Setup: cp .env.example .env → buat database → jalankan migrasi → box server start → buka /employee.',
    'File tests/employee_test.http menguji seluruh route dari editor tanpa membuka browser.',
    'Diagnosis cepat: buka index.cfm?page=... langsung untuk memisahkan masalah rewrite dari masalah aplikasi.',
    'Folder logs/ root proyek berisi dump exception dengan nama UUID yang sama dengan reference ID di halaman error.',
    'Checklist produksi: .env produksi + APP_DEBUG=false, rewrite di web server, uploads writable, HTTPS, backup.',
    'Framework tumbuh dengan meniru pola Employee untuk modul baru, lalu memisahkan core/ menjadi paket CommandBox.'
  ]
});
