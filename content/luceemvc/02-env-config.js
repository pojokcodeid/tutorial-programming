/* ============================================================
   Pelajaran Framework MVC (Lucee CFML) — Bab 2: Konfigurasi .env (M2)
   ============================================================ */
'use strict';

window.LUCEEMVC_LESSONS = window.LUCEEMVC_LESSONS || [];

window.LUCEEMVC_LESSONS.push({
  id: 'mvc-env',
  title: 'Konfigurasi Aplikasi dari File .env',
  chapter: 'Proyek Praktis: Framework MVC',
  duration: '15 menit',
  intro: [
    'Konfigurasi framework — kredensial database, URL dasar, mode debug — tidak boleh menetap di dalam kode. Pelajaran ini mengganti pola lama (file <code>configs/global.json</code>) dengan pola modern: membaca semuanya dari <b>file .env</b>, sama seperti proyek Go, Node, atau Django pada umumnya.',
    'Kamu akan menulis <b>parsing .env sendiri</b> dengan <code>core/Env.cfc</code> (tanpa ekstensi tambahan), menyambungkannya ke <code>Application.cfc</code> untuk membangun datasource dinamis, dan membagikannya ke seluruh aplikasi lewat <code>application</code> scope.'
  ],
  objectives: [
    'Menjelaskan mengapa konfigurasi .env lebih aman daripada file JSON di dalam kode',
    'Menulis komponen parser .env: komentar, string kosong, dan tanda kutip',
    'Menyambungkan hasil .env ke this.datasources di Application.cfc',
    'Membaca konfigurasi dari application scope di controller dan view',
    'Menerapkan pola .env.example + .gitignore agar rahasia tidak ikut ter-commit',
    'Memahami fallback bila file .env tidak ditemukan'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Kenapa .env, bukan JSON?</h3><p>Versi awal framework menyimpan konfigurasi di <code>configs/global.json</code>: file berisi nama datasource, host, username, dan password database. Masalahnya jelas — file JSON harus ikut ter-commit ke git agar aplikasi bisa dijalankan tim lain, sehingga kredensial bocor ke riwayat repositori. Berpindah server berarti mengedit file itu juga, dan ada risiko versi produksi tertimpa versi development.</p><p>Pola <b>.env</b> membalik situasinya: satu file berisi pasangan <code>KEY=nilai</code> yang <b>tidak pernah di-commit</b> (masuk <code>.gitignore</code>), disertai <code>.env.example</code> berisi kerangka kunci tanpa rahasia. Tiap lingkungan (lokal, staging, produksi) memiliki .env miliknya sendiri, dan mengganti kredensial cukup mengedit satu file tanpa menyentuh kode.</p>'
    },
    {
      type: 'text',
      html: '<h3>Format File .env</h3><p>Format .env sangat sederhana: satu pasangan per baris, <code>KEY=nilai</code>, komentar diawali <code>#</code>, dan nilai boleh dikutip bila mengandung spasi. Tidak ada tipe data — semua nilai berupa teks, sehingga angka perlu dikonversi dengan <code>val()</code> saat dipakai.</p>'
    },
    {
      type: 'example',
      title: '.env.example — kerangka konfigurasi',
      lang: 'bash',
      output: false,
      code: `# Nama aplikasi — juga menjadi this.name di Application.cfc
APP_NAME=cfml-mvc-framework

# URL dasar aplikasi — dipakai untuk link & redirect
APP_URL=http://localhost:8888

# Mode debug: true = tampilkan detail error
APP_DEBUG=false

# Database (MariaDB / MySQL)
DB_DRIVER_CLASS=org.mariadb.jdbc.Driver
DB_TYPE=mariadb
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=latihan
DB_USER=root
DB_PASSWORD=
DB_CONNECTION_LIMIT=5

# Folder upload (relatif terhadap webroot src/)
UPLOAD_DIR=public/uploads`,
      explain: [
        'Salin file ini menjadi <code>.env</code> lalu isi nilainya sesuai lingkunganmu: <code>cp .env.example .env</code>.',
        'Komentar <code>#</code> menjelaskan peran tiap kunci — dokumentasi hidup bersama konfigurasinya.',
        '<code>DB_PASSWORD</code> boleh kosong (dihitung "") untuk database lokal tanpa password.'
      ]
    },
    {
      type: 'example',
      title: '.gitignore — jaga agar rahasia tidak ikut ter-commit',
      lang: 'bash',
      output: false,
      code: `# Konfigurasi rahasia — jangan di-commit
.env`,
      explain: [
        'Cukup satu baris: file .env tidak akan pernah masuk ke git.',
        'Sebelum commit pertama, jalankan <code>git status</code> dan pastikan .env tidak tercantum.',
        'Bila rahasia sempat ter-commit, menghapusnya dari .gitignore saja tidak cukup — riwayat harus dibersihkan dengan <code>git filter-repo</code> dan password diganti.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Menulis Parser .env Sendiri</h3><p>CommandBox menyediakan ekstensi <code>commandbox-dotenv</code> yang memuat .env ke environment variable JVM. Namun untuk framework yang bisa dibawa ke server mana pun tanpa dependensi ekstensi, kita menulis parser sendiri — hanya sekitar 40 baris cfscript, sekaligus latihan bagus membaca file dengan <code>fileRead()</code> dan mengurai string.</p>'
    },
    {
      type: 'example',
      title: 'src/core/Env.cfc — parser .env',
      lang: 'cfml',
      output: false,
      code: `component {

  public struct function load(required string filePath) {
    var result = {};

    if (!fileExists(arguments.filePath)) {
      return result;   // .env tidak ada: kembalikan struct kosong
    }

    var lines = listToArray(fileRead(arguments.filePath), chr(10), true);

    for (var line in lines) {
      line = trim(line);

      // Lewati baris kosong dan komentar
      if (!len(line)) continue;
      if (left(line, 1) == chr(35)) continue;   // chr(35) = tanda #

      // Lewati baris yang bukan pasangan KEY=nilai
      if (!find("=", line)) continue;

      var key   = ucase(trim(listFirst(line, "=")));
      var value = trim(listRest(line, "="));

      // Buang pasangan kutip di ujung nilai
      if (len(value) >= 2) {
        var first = left(value, 1);
        var last  = right(value, 1);
        if ((first == '"' && last == '"') || (first == "'" && last == "'")) {
          value = mid(value, 2, len(value) - 2);
        }
      }

      result[key] = value;
    }

    return result;
  }

  public string function get(
    required struct env,
    required string key,
    string defaultValue = ""
  ) {
    var k = ucase(arguments.key);
    return structKeyExists(arguments.env, k)
      ? arguments.env[k]
      : arguments.defaultValue;
  }

}`,
      explain: [
        '<code>listToArray(teks, chr(10), true)</code> memecah isi file menjadi array baris, parameter <code>true</code> mengabaikan elemen kosong.',
        '<code>chr(35)</code> dipakai sebagai pengganti karakter <code>#</code> literal — aman dari konflik dengan sintaks interpolasi CFML.',
        '<code>listFirst</code>/<code>listRest</code> memisahkan di tanda <code>=</code> pertama, sehingga nilai mengandung <code>=</code> (mis. URL query) tetap utuh.',
        'Tanda kutip tunggal maupun ganda dibuang — kutip hanya dipakai agar spasi di ujung nilai tidak hilang oleh <code>trim()</code>.',
        'Method <code>get()</code> menyediakan akses aman dengan nilai default, mis. <code>env("APP_URL", "http://localhost:8000")</code>.'
      ]
    },
    {
      type: 'warn',
      title: 'chr(35) bukan sekadar gaya',
      text: 'Menulis karakter <code>#</code> langsung di dalam string CFML berbahaya karena <code>#</code> adalah penanda interpolasi ekspresi. <code>chr(35)</code> menghasilkan karakter yang sama tanpa membingungkan parser. Berlaku pula untuk <code>chr(92)</code> (backslash) pada path Windows.'
    },
    {
      type: 'text',
      html: '<h3>Memuat .env di Application.cfc</h3><p><code>Application.cfc</code> dibaca Lucee sekali saat aplikasi dimuat — waktu yang tepat memuat .env sekali lalu membangun <code>this.datasources</code> dari isinya. Bila .env tidak ada, aplikasi berhenti dengan pesan yang jelas, bukan error koneksi database yang membingungkan.</p>'
    },
    {
      type: 'example',
      title: 'Application.cfc — .env menjadi datasource',
      lang: 'cfml',
      output: false,
      code: `component {

  // Muat .env dari root proyek (satu tingkat di atas webroot src/)
  variables.envFile = getDirectoryFromPath(getCurrentTemplatePath())
                      & "../.env";
  variables.env     = new core.Env().load(variables.envFile);

  if (!structKeyExists(variables.env, "APP_NAME")) {
    writeOutput("<h2>File .env tidak ditemukan</h2>
      <p>Salin <code>.env.example</code> menjadi <code>.env</code>,
      lalu jalankan <code>box server restart</code>.</p>");
    abort;
  }

  this.name              = variables.env.APP_NAME;
  this.sessionManagement = true;
  this.sessionTimeout    = createTimeSpan(0, 0, 30, 0);

  // Datasource dibangun dari nilai .env
  variables.datasourceName = "appDB";

  this.datasources[variables.datasourceName] = {
    class           : variables.env.DB_DRIVER_CLASS,
    connectionString: "jdbc:#variables.env.DB_TYPE#://"
                      & variables.env.DB_HOST & ":"
                      & variables.env.DB_PORT & "/"
                      & variables.env.DB_NAME
                      & "?characterEncoding=UTF-8",
    username        : variables.env.DB_USER,
    password        : variables.env.DB_PASSWORD,
    connectionLimit : val(variables.env.DB_CONNECTION_LIMIT)
  };
  this.datasource = variables.datasourceName;

  function onApplicationStart() {
    application.env     = variables.env;
    application.baseURL = variables.env.APP_URL;
    return true;
  }

}`,
      explain: [
        '<code>getDirectoryFromPath(getCurrentTemplatePath()) & "../.env"</code> menemukan .env di root proyek — di luar webroot, aman dari akses browser.',
        'Pengecekan <code>APP_NAME</code> berfungsi sebagai indikator .env berhasil dimuat; bila kosong, aplikasi berhenti dengan instruksi yang bisa ditindaklanjuti.',
        'String JDBC disusun dari beberapa kunci: host, port, nama database — semua bebas diganti tanpa menyentuh kode.',
        '<code>onApplicationStart()</code> menyalin konfigurasi ke <code>application</code> scope agar bisa dibaca controller dan view kapan pun.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Membaca Konfigurasi di Aplikasi</h3><p>Konfigurasi tersedia di <code>application.env</code> sebagai struct. Agar pemanggilan ringkas dan tidak tunduk pada penulisan kunci, BaseController menyediakan method pembantu <code>env()</code> yang memakai parser yang sama.</p>'
    },
    {
      type: 'example',
      title: 'Helper env() di BaseController',
      lang: 'cfml',
      output: false,
      code: `// Di dalam BaseController.cfc
function env(string key, string defaultValue = "") {
  return new core.Env().get(application.env, key, defaultValue);
}

// Dipakai di controller mana pun:
var uploadPath = "/" & env("UPLOAD_DIR", "public/uploads") & "/";

// Contoh pemakaian di view (.cfm):
// <cfoutput>#application.baseURL#/employee</cfoutput>`,
      explain: [
        'Nilai default pada parameter melindungi pemakaian: bila <code>UPLOAD_DIR</code> hilang dari .env, aplikasi tetap berjalan dengan jalur bawaan.',
        'View memakai <code>application.baseURL</code> langsung untuk membangun link — mudah berpindah domain tanpa mengedit template.'
      ]
    },
    {
      type: 'tip',
      title: 'Mengubah .env butuh restart',
      text: '<code>Application.cfc</code> hanya dibaca sekali per siklus hidup aplikasi. Setelah mengubah .env, jalankan <code>box server restart</code> (atau hapus folder .commandbox di proyek) agar nilai baru terbaca. Dalam pengembangan, ini adalah perintah paling sering dijalankan setelah mengubah konfigurasi.'
    },
    {
      type: 'text',
      html: '<h3>.env di Produksi: Environment Variable</h3><p>Saat deployment, file .env tetap merupakan cara paling praktis — cukup salin file berbeda ke tiap server. Alternatif lain: menyetel environment variable langsung di sistem (Docker <code>-e DB_NAME=...</code>, Apache/Nginx <code>SetEnv</code>, atau systemd). Parser .env kamu bisa diperluas untuk mengecek environment variable JVM lebih dulu sebelum membaca file, mengikuti prinsip <i>12-Factor App</i>: konfigurasi dipisahkan dari kode.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['.env', 'File teks berisi pasangan KEY=nilai untuk konfigurasi aplikasi; tidak ikut di-commit ke git.'],
        ['.env.example', 'Kerangka kunci .env tanpa nilai rahasia — menjadi dokumentasi konfigurasi bagi tim.'],
        ['12-Factor App', 'Metodologi membangun aplikasi web modern; faktor ke-3 menuntut konfigurasi dipisahkan dari kode.'],
        ['Environment variable', 'Variabel yang disetel oleh sistem operasi/container dan terbaca program tanpa file konfigurasi.'],
        ['fileRead()', 'Fungsi CFML yang membaca seluruh isi file teks menjadi string.'],
        ['connectionLimit', 'Batas jumlah koneksi database di connection pool; menangkal kebocoran koneksi.']
      ]
    }
  ],
  recap: [
    'File .env menjaga kredensial agar tidak ter-commit; .env.example mendokumentasikan kunci yang tersedia.',
    'Format .env: KEY=nilai per baris, komentar #, dan kutip opsional untuk nilai berspasi.',
    'core/Env.cfc mem-parsing .env dengan fileRead + listToArray, menghasilkan struct ber-key uppercase.',
    'Application.cfc memuat .env sekali lalu membangun this.datasources dari isinya; bila .env hilang, aplikasi berhenti dengan pesan jelas.',
    'Hasil .env dibagikan ke aplikasi lewat application.env dan dibaca lewat helper env() di BaseController.',
    'Perubahan .env baru aktif setelah box server restart.'
  ]
});
