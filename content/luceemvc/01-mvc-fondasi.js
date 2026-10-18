/* ============================================================
   Pelajaran Framework MVC (Lucee CFML) — Bab 1: Fondasi Framework MVC (M1)
   ============================================================ */
'use strict';

window.LUCEEMVC_LESSONS = window.LUCEEMVC_LESSONS || [];

window.LUCEEMVC_LESSONS.push({
  id: 'mvc-fondasi',
  title: 'Fondasi Framework MVC: Arsitektur & Setup Proyek',
  chapter: 'Proyek Praktis: Framework MVC',
  duration: '16 menit',
  intro: [
    'Di pelajaran ini kamu mulai membangun <b>framework MVC ringan buatan sendiri</b> dengan Lucee CFML — bukan memakai framework jadi, tapi memahami bagaimana kerangka kerja seperti ColdBox bekerja di balik layar.',
    'Kamu akan menyusun arsitektur <b>Model–View–Controller</b>, menyiapkan proyek CommandBox dengan URL rewrite, dan memasang <b>front controller</b> sebagai satu-satunya pintu masuk request. Materi pelajaran ini adalah dasar yang dibangun oleh pelajaran berikutnya: routing, controller, model, hingga konfigurasi .env.'
  ],
  objectives: [
    'Menjelaskan pola arsitektur MVC dan manfaatnya bagi proyek CFML',
    'Menyusun struktur folder framework MVC yang rapi dan terukur',
    'Menyiapkan proyek CommandBox: box.json, server.json, dan customRewrites.xml',
    'Mengaktifkan URL rewrite sehingga URL bersih tanpa .cfm',
    'Memahami peran front controller index.cfm sebagai satu-satunya pintu masuk request',
    'Menjalankan skeleton framework dan memverifikasi rewrite bekerja'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Apa itu MVC?</h3><p><b>MVC</b> (Model–View–Controller) adalah pola arsitektur yang memisahkan aplikasi menjadi tiga bagian berbeda tanggung jawab. <b>Model</b> menangani data dan logika bisnis (query, validasi aturan bisnis). <b>View</b> bertugas menampilkan halaman ke user. <b>Controller</b> menjadi penengah: menerima request, memanggil Model untuk memproses data, lalu memilih View mana yang dirender.</p><p>Tanpa pemisahan ini, satu file .cfm bisa berisi query database, logika perhitungan, dan tag HTML sekaligus — sulit diuji, sulit dicari bug-nya, dan cepat berantakan saat proyek membesar.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Diagram alur MVC: browser ke router ke controller, lalu model dan view, kembali ke browser">
        <defs><marker id="mk-mvc-1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#94a3b8"/></marker></defs>
        <rect x="20" y="120" width="120" height="60" rx="8" class="u-box"/>
        <text x="80" y="146" class="u-title" text-anchor="middle">Browser</text>
        <text x="80" y="166" class="u-lbl" text-anchor="middle">request URL</text>
        <line x1="142" y1="150" x2="181" y2="150" class="u-line" marker-end="url(#mk-mvc-1)"/>
        <rect x="185" y="120" width="130" height="60" rx="8" class="u-hd"/>
        <text x="250" y="146" class="u-title" text-anchor="middle">Router</text>
        <text x="250" y="166" class="u-lbl" text-anchor="middle">cari route cocok</text>
        <line x1="317" y1="150" x2="356" y2="150" class="u-line" marker-end="url(#mk-mvc-1)"/>
        <rect x="360" y="120" width="130" height="60" rx="8" class="u-box"/>
        <text x="425" y="146" class="u-title" text-anchor="middle">Controller</text>
        <text x="425" y="166" class="u-lbl" text-anchor="middle">atur alur kerja</text>
        <line x1="425" y1="120" x2="425" y2="72" class="u-line" marker-end="url(#mk-mvc-1)"/>
        <rect x="360" y="12" width="130" height="60" rx="8" class="u-box"/>
        <text x="425" y="38" class="u-title" text-anchor="middle">Model</text>
        <text x="425" y="58" class="u-lbl" text-anchor="middle">query &amp; data</text>
        <line x1="492" y1="150" x2="531" y2="150" class="u-line" marker-end="url(#mk-mvc-1)"/>
        <rect x="535" y="120" width="120" height="60" rx="8" class="u-box"/>
        <text x="595" y="146" class="u-title" text-anchor="middle">View</text>
        <text x="595" y="166" class="u-lbl" text-anchor="middle">render HTML</text>
        <line x1="595" y1="182" x2="595" y2="240" class="u-line" marker-end="url(#mk-mvc-1)"/>
        <line x1="595" y1="240" x2="82" y2="240" class="u-line"/>
        <line x1="80" y1="240" x2="80" y2="182" class="u-line" marker-end="url(#mk-mvc-1)"/>
        <text x="340" y="262" class="u-lbl" text-anchor="middle">response HTML dikembalikan ke browser</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 21.1</b> — Alur request pada arsitektur MVC: Router → Controller → Model/View → HTML</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Kenapa menulis framework sendiri?</h3><p>Ekosistem CFML punya framework matang seperti ColdBox dan FW/1. Namun menulis framework sendiri memberi dua manfaat yang tidak bisa dibeli: <b>pemahaman</b> — kamu tahu persis apa yang terjadi saat URL diproses; dan <b>kebebasan</b> — framework bisa dibuat seringan mungkin sesuai kebutuhan, tanpa memikat fitur yang tidak dipakai. Prinsipnya sama seperti belajar membuat router di Go atau mengimplementasikan MVC di PHP mentah: setelah memahami isi kotaknya, kamu memakai framework besar dengan jauh lebih bijak.</p>'
    },
    {
      type: 'text',
      html: '<h3>Struktur Folder Framework</h3><p>Struktur yang dipakai sepanjang seri ini terinspirasi pola umum framework CFML: webroot terpisah dari file konfigurasi proyek, inti framework berada di <code>core/</code>, dan kode aplikasi (controllers, models, views) berada di folder masing-masing.</p>'
    },
    {
      type: 'example',
      title: 'Struktur folder framework MVC',
      lang: 'text',
      output: false,
      code: `cfml-mvc-framework/
├── .env.example          # contoh konfigurasi (salin jadi .env)
├── box.json              # metadata proyek CommandBox
├── server.json           # konfigurasi server & webroot
├── customRewrites.xml    # aturan URL rewrite
├── migrations/           # skema SQL database
└── src/                  # webroot — satu-satunya yang disajikan
    ├── Application.cfc   # lifecycle + konfigurasi datasource
    ├── index.cfm         # front controller (pintu masuk semua request)
    ├── core/             # inti framework
    │   ├── Env.cfc       # parser file .env
    │   ├── App.cfc       # mesin routing
    │   ├── Router.cfc    # daftar route aplikasi
    │   ├── BaseController.cfc
    │   ├── Message.cfc   # flash message
    │   └── Validation.cfc
    ├── controllers/      # controller aplikasi
    ├── models/           # model (query & logika bisnis)
    ├── views/            # template tampilan
    └── public/           # aset statis & folder upload`,
      explain: [
        '<code>src/</code> ditetapkan sebagai webroot sehingga file sensitif di root proyek (seperti <code>.env</code>) tidak bisa diakses lewat browser.',
        '<code>core/</code> berisi mesin framework; saat aplikasi kamu jadi, folder ini bisa dipindah ke proyek lain utuh.',
        'Pemisahan controllers / models / views memaksa satu file hanya menangani satu tanggung jawab.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Langkah 1 — Inisialisasi Proyek CommandBox</h3><p>Framework dimulai dari proyek CommandBox biasa. Buat folder proyek, masuk ke dalamnya, lalu buat <code>box.json</code> dan <code>server.json</code> secara manual seperti di bawah ini (atau lewat <code>box init</code>).</p>'
    },
    {
      type: 'example',
      title: 'box.json — metadata proyek',
      lang: 'json',
      output: false,
      code: `{
  "name": "cfml-mvc-framework",
  "description": "Framework MVC ringan untuk Lucee CFML",
  "type": "app",
  "version": "1.0.0",
  "scripts": {
    "start": "server start"
  }
}`,
      explain: [
        '<code>box.json</code> menyimpan metadata proyek dan skrip CommandBox — bukan konfigurasi aplikasi.',
        'Kunci <code>scripts.start</code> membuat <code>box start</code> cukup menulis <code>box server start</code> secara lengkap.',
        'Versi engine Lucee tidak ditulis di sini; penentunya ada di <code>server.json</code>.'
      ]
    },
    {
      type: 'example',
      title: 'server.json — konfigurasi server & webroot',
      lang: 'json',
      output: false,
      code: `{
  "name": "cfml-mvc-framework",
  "app": {
    "cfengine": "lucee@7"
  },
  "web": {
    "host": "localhost",
    "webroot": "src",
    "http": {
      "port": 8888
    },
    "rewrites": {
      "enable": "true",
      "config": "customRewrites.xml"
    }
  }
}`,
      explain: [
        '<code>webroot: "src"</code> menjadikan folder <code>src</code> sebagai akar web — file .env dan migrations di root tidak tersaji ke publik.',
        '<code>rewrites.enable</code> mengaktifkan modul rewrite bawaan CommandBox (berbasis Tuckey URL Rewrite).',
        'Port 8888 dipilih agar tidak bentrok dengan server lain; ganti sesuai kebutuhan.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Langkah 2 — URL Rewrite</h3><p>Tanpa rewrite, URL aplikasi bergaya <code>/index.cfm?page=employee/edit/1</code> — jelek dan mudah bocor ke mesin pencari. Dengan rewrite, cukup <code>/employee/edit/1</code> dan Tuckey diam-diam menerjemahkannya menjadi parameter <code>page</code> yang dikirim ke <code>index.cfm</code>. Inilah alasan semua request harus melewati satu pintu: <b>front controller</b>.</p>'
    },
    {
      type: 'example',
      title: 'customRewrites.xml — terjemahkan semua URL ke index.cfm',
      lang: 'xml',
      output: false,
      code: `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE urlrewrite PUBLIC "-//tuckey.org//DTD UrlRewrite 4.0//EN"
  "http://tuckey.org/res/dtds/urlrewrite4.0.dtd">
<urlrewrite>
  <rule>
    <!-- Jangan ganggu file statis di /public -->
    <condition type="request-uri" operator="notequal">^/public/(.*)$</condition>
    <from>^/(.*)$</from>
    <to type="passthrough" qsappend="true">/index.cfm?page=$1</to>
  </rule>
</urlrewrite>`,
      explain: [
        'Satu aturan utama: setiap URI dikirim ke <code>/index.cfm?page=...</code>, kecuali yang diawali <code>/public/</code>.',
        'Tanpa pengecualian <code>/public/</code>, file CSS dan gambar ikut diforward ke CFML dan gagal dimuat.',
        'Format XML ini sama dengan web.xml servlet — Tuckey adalah library Java yang dipakai CommandBox dan Tomcat.'
      ]
    },
    {
      type: 'warn',
      title: 'URL rewrite harus diaktifkan di server produksi juga',
      text: 'Konfigurasi rewrite hanya hidup di CommandBox. Saat deployment ke Tomcat/IIS/Nginx, pasang modul rewrite serupa (Tuckey di Tomcat, mod_rewrite di Apache, atau blok <code>location</code> di Nginx). Tanpa itu, hanya <code>/index.cfm?page=...</code> yang berfungsi — URL bersih akan 404.'
    },
    {
      type: 'text',
      html: '<h3>Langkah 3 — Front Controller</h3><p><code>index.cfm</code> hanyalah pintu masuk tipis: tugasnya memanggil router dan tidak lebih. Logika penanganan request ada di komponen <code>core/</code>, sehingga <code>index.cfm</code> tidak pernah berubah lagi selama hidup framework.</p>'
    },
    {
      type: 'example',
      title: 'src/index.cfm — pintu masuk tunggal',
      lang: 'cfml',
      output: false,
      code: `<cfscript>
  // Semua request (hasil URL rewrite) masuk lewat halaman ini
  router = new core.Router();
  router.begin();
</cfscript>`,
      explain: [
        'Tag <code>&lt;cfscript&gt;</code> membuat <code>index.cfm</code> terbaca seperti kode biasa, bukan campuran tag HTML.',
        '<code>new core.Router()</code> membuat instance komponen dari folder <code>core</code> relatif terhadap webroot.',
        'Kalau kamu membuka <code>/index.cfm?page=employee</code> secara langsung, hasilnya identik dengan <code>/employee</code> — bukti rewrite bekerja.'
      ]
    },
    {
      type: 'tip',
      title: 'Verifikasi rewrite sebelum menulis kode apa pun',
      text: 'Buat sementara isi <code>index.cfm</code> menjadi <code>&lt;cfoutput&gt;page = #url.page#&lt;/cfoutput&gt;</code>, jalankan <code>box server start</code>, lalu buka <code>http://localhost:8888/halo/dunia</code>. Bila browser menampilkan <code>page = halo/dunia</code>, pipeline rewrite sudah siap dan kamu bisa melangkah ke routing sungguhan.'
    },
    {
      type: 'text',
      html: '<h3>Application.cfc — Kerangka Awal</h3><p><code>Application.cfc</code> adalah file khusus yang dibaca Lucee sekali saat aplikasi dimuat. Di pelajaran berikutnya file ini akan membaca konfigurasi dari file <code>.env</code>; untuk sekarang, cukup definisikan identitas dan timeout aplikasi.</p>'
    },
    {
      type: 'example',
      title: 'Application.cfc — versi minimal',
      lang: 'cfml',
      output: false,
      code: `component {

  this.name              = "cfml-mvc-framework";
  this.applicationTimeout = createTimeSpan(0, 2, 0, 0);
  this.sessionManagement  = true;
  this.sessionTimeout     = createTimeSpan(0, 0, 30, 0);

  function onApplicationStart() {
    return true;
  }

  function onRequestStart(string targetPage) {
  }

}`,
      explain: [
        '<code>this.name</code> harus unik antar aplikasi — namanya menjadi identitas scope application &amp; session.',
        '<code>sessionManagement = true</code> wajib karena flash message pada pelajaran berikutnya menumpang di session.',
        'Callback <code>onError()</code> akan ditambahkan bersama konfigurasi .env pada pelajaran 22.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Menjalankan Skeleton</h3><p>Sampai di sini framework belum menampilkan apa-apa selain halaman kosong — dan itu wajar. Yang penting pipeline sudah terbentuk: request masuk → rewrite → <code>index.cfm</code> → router. Pelajaran berikutnya memasang mesin routing yang menghubungkan URL ke controller method.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['MVC', 'Pola arsitektur yang memisahkan aplikasi menjadi Model (data), View (tampilan), dan Controller (alur kerja).'],
        ['Front controller', 'Satu halaman tunggal (index.cfm) yang menjadi pintu masuk semua request aplikasi.'],
        ['URL rewrite', 'Penerjemahan URL bersih (/<i>employee/1</i>) menjadi URL internal (index.cfm?page=employee/1) oleh server.'],
        ['Webroot', 'Folder yang disajikan ke publik oleh web server; di proyek ini folder src/.'],
        ['Tuckey', 'Library Java untuk URL rewrite yang dipakai CommandBox dan Tomcat.'],
        ['Route', 'Satu aturan pasangan method HTTP + pola path yang mengarah ke controller method tertentu.']
      ]
    }
  ],
  recap: [
    'MVC memisahkan tanggung jawab: Model (data & logika bisnis), View (tampilan), Controller (alur kerja request).',
    'Struktur framework: webroot src/ terpisah dari konfigurasi proyek; inti framework berada di core/.',
    'server.json menetapkan webroot src, port 8888, dan mengaktifkan URL rewrite dengan customRewrites.xml.',
    'Aturan rewrite meneruskan semua URI ke index.cfm?page=$1, kecuali jalur /public/ untuk file statis.',
    'index.cfm adalah front controller tipis: hanya memanggil router, tanpa logika bisnis.',
    'Application.cfc menyimpan identitas aplikasi, pengaturan session, dan lifecycle callback.'
  ]
});
