/* ============================================================
   Pelajaran Framework MVC (Lucee CFML) — Bab 3: Mesin Routing (M3)
   ============================================================ */
'use strict';

window.LUCEEMVC_LESSONS = window.LUCEEMVC_LESSONS || [];

window.LUCEEMVC_LESSONS.push({
  id: 'mvc-router',
  title: 'Mesin Routing: URL ke Controller Method',
  chapter: 'Proyek Praktis: Framework MVC',
  duration: '17 menit',
  intro: [
    'Jantung sebuah framework MVC adalah <b>router</b>: komponen yang menerjemahkan pasangan method HTTP + URL menjadi pemanggilan method controller. Pelajaran ini membangun dua bagian: <b>core/App.cfc</b> — mesin routing yang mencocokkan pola path dan menangkap parameter (seperti <code>:id</code>) — dan <b>core/Router.cfc</b> — daftar route yang dibaca manusia.',
    'Kamu juga akan mempelajari bagaimana JSON body ditangani sebagai parameter tambahan, sehingga route yang sama bisa melayani halaman web maupun API.'
  ],
  objectives: [
    'Mengubah url.page hasil rewrite menjadi array segmen path',
    'Mencocokkan pola route dengan parameter :nama terhadap URL request',
    'Meneruskan nilai parameter URL sebagai argument method controller',
    'Menangani JSON body sebagai argument content untuk REST API',
    'Mengembalikan pesan error terstruktur bila controller/method tidak ditemukan',
    'Menulis daftar route yang rapi di core/Router.cfc'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Konsep: Dari URL ke Method</h3><p>Setelah URL rewrite, semua request tiba di <code>index.cfm</code> dengan satu variabel: <code>url.page</code>. Untuk <code>/employee/edit/12</code>, nilainya adalah string <code>"employee/edit/12"</code>. Tugas mesin routing: memecah string itu menjadi segmen, mencocokkannya dengan daftar pola route, lalu memanggil method controller yang dituju beserta parameter yang tertangkap.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 230" width="760" role="img" aria-label="Diagram pencocokan route: url.page employee/edit/12 dicocokkan dengan pola employee/edit/:id menghasilkan controller em.EmployeeController method getById dengan argumen id=12">
        <defs><marker id="mk-rt-1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#94a3b8"/></marker></defs>
        <rect x="20" y="30" width="200" height="60" rx="8" class="u-box"/>
        <text x="120" y="56" class="u-title" text-anchor="middle">url.page</text>
        <text x="120" y="76" class="u-lbl" text-anchor="middle">"employee/edit/12"</text>
        <line x1="222" y1="60" x2="271" y2="60" class="u-line" marker-end="url(#mk-rt-1)"/>
        <rect x="275" y="30" width="210" height="60" rx="8" class="u-hd"/>
        <text x="380" y="56" class="u-title" text-anchor="middle">Pola route</text>
        <text x="380" y="76" class="u-lbl" text-anchor="middle">"/employee/edit/:id"</text>
        <line x1="487" y1="60" x2="536" y2="60" class="u-line" marker-end="url(#mk-rt-1)"/>
        <rect x="540" y="30" width="200" height="60" rx="8" class="u-box"/>
        <text x="640" y="56" class="u-title" text-anchor="middle">Cocok ✓</text>
        <text x="640" y="76" class="u-lbl" text-anchor="middle">id = "12"</text>
        <rect x="275" y="140" width="210" height="60" rx="8" class="u-box"/>
        <text x="380" y="166" class="u-title" text-anchor="middle">Controller</text>
        <text x="380" y="186" class="u-lbl" text-anchor="middle">em.EmployeeController</text>
        <line x1="487" y1="170" x2="536" y2="170" class="u-line" marker-end="url(#mk-rt-1)"/>
        <rect x="540" y="140" width="200" height="60" rx="8" class="u-box"/>
        <text x="640" y="166" class="u-title" text-anchor="middle">getById( id )</text>
        <text x="640" y="186" class="u-lbl" text-anchor="middle">argumen dari URL</text>
        <line x1="380" y1="92" x2="380" y2="138" class="u-line" marker-end="url(#mk-rt-1)"/>
      </svg></div><figcaption class="fig-cap"><b>Gambar 23.1</b> — Pencocokan pola route: segmen ber-prefix : menjadi argument method controller</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Struktur Data Route</h3><p>Setiap route disimpan sebagai satu entri berisi tiga hal: path pola, method HTTP, dan target (controller + method). Kumpulan route disimpan dalam array, diurutkan dari depan ke belakang — route pertama yang cocok yang menang, sehingga urutan pendaftaran berpengaruh.</p>'
    },
    {
      type: 'example',
      title: 'core/App.cfc — kerangka mesin routing',
      lang: 'cfml',
      output: false,
      code: `component {

  property array  params;
  property array  paramsVariables;
  property array  handlers;
  property string controllerFile;
  property string controllerMethod;

  public function init() {
    variables.controllerFile   = "Default";
    variables.controllerMethod = "index";
    variables.params          = [];
    variables.paramsVariables = [];
    variables.handlers        = [];
    return this;
  }

  public function get(string uri, any callback) {
    setHandler("GET", uri, callback);
  }

  public function post(string uri, any callback) {
    setHandler("POST", uri, callback);
  }

  public function put(string uri, any callback) {
    setHandler("PUT", uri, callback);
  }

  public function delete(string uri, any callback) {
    setHandler("DELETE", uri, callback);
  }

  private function setHandler(string method, string path, any handler) {
    arrayAppend(variables.handlers, {
      path    = path,
      method  = method,
      handler = handler
    });
  }

  // ... method run() dibahas di bawah

}`,
      explain: [
        'Method <code>get/post/put/delete</code> hanyalah pembungkus <code>setHandler()</code> — API yang manusiawi untuk mendaftarkan route.',
        'Callback route berupa struct <code>{ controller: "...", method: "..." }</code>, bukan closure — sederhana dan mudah di-inspect.',
        'Nilai awal <code>Default</code> + <code>index</code> menjadi jaring pengaman: URL yang tidak cocok route apa pun jatuh ke controller Default.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Inti: Method run()</h3><p>Method <code>run()</code> adalah otak framework. Ia memecah <code>url.page</code> menjadi segmen, lalu untuk tiap route membandingkan segmen per segmen. Segmen route yang diawali tanda <code>:</code> adalah <b>parameter</b> — menangkap nilai apa pun dari URL dan meneruskannya sebagai argument bernama.</p>'
    },
    {
      type: 'example',
      title: 'run() — mencocokkan route dan memanggil controller',
      lang: 'cfml',
      output: false,
      code: `public function run() {
  // url.page hasil rewrite: "/employee/edit/12"
  var urlPage    = structKeyExists(url, "page") ? trim(url.page) : "";
  var httpMethod = ucase(cgi.request_method);

  for (var handler in variables.handlers) {
    var routeSegments = listToArray(handler.path, "/");
    var pageSegments  = len(urlPage) ? listToArray(urlPage, "/") : [];

    // Panjang segmen harus sama agar route cocok
    if (arrayLen(routeSegments) != arrayLen(pageSegments)) {
      continue;
    }

    // Cocokkan tiap segmen; ":id" menangkap nilai apa pun
    variables.params          = [];
    variables.paramsVariables = [];
    var isMatch = true;

    for (var i = 1; i <= arrayLen(routeSegments); i++) {
      var segment = routeSegments[i];
      if (left(segment, 1) == ":") {
        // Parameter URL — simpan nama & nilainya
        arrayAppend(variables.paramsVariables, mid(segment, 2, len(segment)));
        arrayAppend(variables.params, pageSegments[i]);
      } else if (segment != pageSegments[i]) {
        isMatch = false;
        break;
      }
    }

    if (isMatch && httpMethod == handler.method) {
      variables.controllerFile   = handler.handler.controller;
      variables.controllerMethod = handler.handler.method;
      break;   // route pertama yang cocok menang
    }
  }

  // ... dilanjutkan pada contoh berikutnya
}`,
      explain: [
        'Pemeriksaan panjang segmen menolak pasangan seperti <code>/employee</code> terhadap pola <code>/employee/:id</code> — cepat dan jelas.',
        'Blok <code>if (left(segment, 1) == ":")</code> adalah deteksi parameter: <code>:id</code> menghasilkan nama <code>id</code> dan nilai dari segmen URL yang seposisi.',
        'Saat satu segmen literal tidak cocok, loop segera <code>break</code> — tidak perlu memeriksa sisa segmen.',
        '<code>break</code> setelah cocok mengunci route pertama yang menang; karena itu route statis sebaiknya didaftarkan sebelum route berparameter serupa.'
      ]
    },
    {
      type: 'text',
      html: '<h3>JSON Body dan Pemanggilan Controller</h3><p>Setelah route cocok, dua tugas tersisa: mengubah array parameter menjadi struct argument, dan menambahkan JSON body (bila ada) sebagai argument <code>content</code> — pola yang membuat route yang sama bisa dipakai form HTML maupun klien API.</p>'
    },
    {
      type: 'example',
      title: 'Bagian akhir run(): JSON body & pemanggilan controller',
      lang: 'cfml',
      output: false,
      code: `  // Tangani kiriman JSON body (dipakai oleh REST API)
  var content = {};
  if (len(trim(getHttpRequestData().content))) {
    try {
      content = deserializeJSON(getHttpRequestData().content);
    } catch (any e) {
      content = form;   // fallback ke form biasa bila bukan JSON valid
    }
    arrayAppend(variables.paramsVariables, "content");
    arrayAppend(variables.params, content);
  }

  // Pastikan file controller ada
  var controllerPath = "/controllers/#replace(variables.controllerFile, ".", "/", "all")#.cfc";
  if (!fileExists(expandPath(controllerPath))) {
    return {
      success = false,
      message = "Controller '#variables.controllerFile#' not found."
    };
  }

  var controller = createObject("component", "controllers.#variables.controllerFile#");

  if (!structKeyExists(controller, variables.controllerMethod)) {
    return {
      success = false,
      message = "Method '#variables.controllerMethod#' not found."
    };
  }

  // Panggil method controller dengan argumentCollection
  return controller[variables.controllerMethod](
    argumentCollection = paramsToStruct(variables.params)
  );
}

// Ubah array params menjadi struct sesuai nama parameter route
private function paramsToStruct(array params) {
  var s = {};
  for (var i = 1; i <= arrayLen(arguments.params); i++) {
    s[variables.paramsVariables[i]] = arguments.params[i];
  }
  return s;
}`,
      explain: [
        '<code>getHttpRequestData().content</code> berisi body mentah request; kosong bila tidak ada payload.',
        'Nama <code>em.EmployeeController</code> mengandung titik yang menjadi penanda folder — <code>replace(".", "/", "all")</code> mengubahnya jadi jalur file <code>/controllers/em/EmployeeController.cfc</code>.',
        '<code>controller[method](argumentCollection = ...)</code> memanggil method dinamis berdasarkan nilai variabel — kunci fleksibilitas router.',
        'Bila controller tidak ada, framework mengembalikan struct <code>{ success, message }</code> alih-alih crash — memudahkan debugging.'
      ]
    },
    {
      type: 'warn',
      title: 'Dinamis berarti teliti',
      text: 'Router memanggil method berdasarkan input URL. Jangan pernah mengekspos method private atau method berbahaya lewat route. Selain itu, bersihkan parameter (mis. <code>val()</code> untuk id numerik) di dalam controller — router hanya meneruskan teks apa adanya dari URL.'
    },
    {
      type: 'text',
      html: '<h3>core/Router.cfc — Daftar Route</h3><p>Dengan mesin siap, pendaftaran route menjadi deklaratif dan mudah dibaca. Saat aplikasi membesar, file ini adalah peta navigasi seluruh aplikasi — satu tempat untuk melihat semua endpoint yang ada.</p>'
    },
    {
      type: 'example',
      title: 'core/Router.cfc — mendaftarkan route',
      lang: 'cfml',
      output: false,
      code: `component {

  function begin() {
    var app = new core.App();
    app.setDefaultController("Default");
    app.setDefaultControllerMethod("index");

    // Route dengan parameter URL (tanda :)
    app.get("/employee/say-hay",   { controller: "em.EmployeeController", method: "sayHay" });
    app.get("/employee",           { controller: "em.EmployeeController", method: "getAll" });
    app.get("/employee/add",       { controller: "em.EmployeeController", method: "addNew" });
    app.get("/employee/edit/:id",  { controller: "em.EmployeeController", method: "getById" });
    app.post("/employee/edit/:id", { controller: "em.EmployeeController", method: "updateData" });
    app.post("/employee",          { controller: "em.EmployeeController", method: "createData" });
    app.get("/employee/delete/:id",{ controller: "em.EmployeeController", method: "deleteData" });

    app.run();
  }

}`,
      explain: [
        'Setiap baris dibaca sebagai satu kalimat: <i>"GET /employee/edit/:id → EmployeeController.getById"</i>.',
        'Dua route dengan path sama tapi method berbeda (GET dan POST <code>/employee/edit/:id</code>) sah — HTTP method menjadi bagian dari pencocokan.',
        'Route <code>/employee/add</code> didaftarkan sebelum <code>/employee/edit/:id</code> agar pola statis menang lebih dulu atas pola berparameter.'
      ]
    },
    {
      type: 'tip',
      title: 'Uji route tanpa browser',
      text: 'Karena router mengembalikan struct, route JSON bisa diuji langsung: buka <code>/employee/say-hay</code> di browser atau kirim request dengan <code>curl</code>. Untuk request POST/PUT, gunakan file <code>tests/employee_test.http</code> dengan REST Client VS Code — jauh lebih cepat daripada mengisi form manual berulang kali.'
    },
    {
      type: 'vocab',
      items: [
        ['url.page', 'Variabel berisi hasil URL rewrite; satu-satunya input URL yang dipakai mesin routing.'],
        ['Segmen path', 'Satu potong URL yang dipisah garis miring; /employee/edit/12 terdiri dari 3 segmen.'],
        ['Parameter route', 'Segmen pola berprefix titik dua (:id) yang menangkap nilai dari URL.'],
        ['argumentCollection', 'Cara memanggil fungsi CFML dengan struct, setiap key menjadi nama argument.'],
        ['cgi.request_method', 'Variabel bawaan berisi method HTTP request: GET, POST, PUT, atau DELETE.'],
        ['Front controller pattern', 'Pola semua request melewati satu titik masuk yang meneruskan ke handler sesuai.']
      ]
    }
  ],
  recap: [
    'Mesin routing memecah url.page menjadi segmen lalu mencocokkannya per segmen terhadap tiap pola route.',
    'Segmen pola berprefix : adalah parameter yang menangkap nilai URL lalu diteruskan sebagai argument bernama.',
    'Method HTTP menjadi bagian pencocokan: GET dan POST pada path sama mengarah ke method berbeda.',
    'JSON body request di-parse lalu diteruskan sebagai argument content — satu route melayani form dan API.',
    'Bila file controller atau method tidak ditemukan, framework mengembalikan struct { success, message } alih-alih error fatal.',
    'core/Router.cfc adalah daftar deklaratif semua route; urutan pendaftaran menentukan route mana yang menang.'
  ]
});
