/* ============================================================
   Pelajaran Framework MVC (Lucee CFML) — Bab 4: Controller & View (M4)
   ============================================================ */
'use strict';

window.LUCEEMVC_LESSONS = window.LUCEEMVC_LESSONS || [];

window.LUCEEMVC_LESSONS.push({
  id: 'mvc-controller-view',
  title: 'BaseController, View & Flash Message',
  chapter: 'Proyek Praktis: Framework MVC',
  duration: '16 menit',
  intro: [
    'Router sudah bisa memanggil method controller — sekarang method itu perlu alat kerja. Pelajaran ini membangun <b>core/BaseController.cfc</b>: induk semua controller yang menyediakan <code>view()</code> untuk merender template dengan layout, <code>model()</code> untuk memuat komponen model, <code>redirect()</code> setelah aksi, dan <b>flash message</b> sebagai umpan balik sekali tampil.',
    'Juga dibahas <b>layout template</b> (header/footer) dan cara data controller disuntikkan ke view sebagai variabel lokal.'
  ],
  objectives: [
    'Membuat BaseController dengan method view(), model(), redirect(), dan upload()',
    'Merender view dengan layout header/footer memakai include berurutan',
    'Menyuntikkan data struct ke variabel view',
    'Mengimplementasikan flash message di session: set sekali, tampil sekali, habis',
    'Menggunakan encodeForHTML() untuk mencegah XSS di view',
    'Menulis controller aplikasi pertama yang menerapkan seluruh helper'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Tanggung Jawab Controller</h3><p>Controller adalah orkestrator: ia tidak query database secara langsung (itu urusan model), tidak menulis HTML (itu urusan view), dan tidak mengatur routing (itu urusan router). Tugasnya menerima request, memvalidasi input, memanggil model, memilih view, lalu memberi tahu user hasilnya lewat flash message dan redirect. Karena pola ini berulang di semua controller, kodenya diletakkan di <b>BaseController</b> — induk yang diwarisi oleh setiap controller aplikasi.</p>'
    },
    {
      type: 'text',
      html: '<h3>view() — Render Template dengan Layout</h3><p>Di CFML, <code>include</code> menyisipkan isi file .cfm ke halaman berjalan, dan variabel halaman terlihat oleh file yang disertakan. Ini membuat method <code>view()</code> sederhana: sisipkan header, sisipkan view yang diminta, lalu sisipkan footer. Hasilnya HTML utuh dengan layout konsisten tanpa dupikasi tag di setiap template.</p>'
    },
    {
      type: 'example',
      title: 'core/BaseController.cfc — bagian view, model, redirect',
      lang: 'cfml',
      output: false,
      code: `component extends="core.Message" {

  function init() {
    return this;
  }

  /**
   * Render view .cfm beserta layout header/footer.
   * Isi struct content disuntikkan sebagai variabel di view.
   */
  function view(filePath, content = {}) {
    // Suntikkan data sebagai variabel yang bisa dipakai template
    for (var key in content) {
      variables[key] = content[key];
    }

    var viewFile = "/views/#replace(filePath, ".", "/", "all")#.cfm";
    if (fileExists(expandPath(viewFile))) {
      include "/views/templates/header.cfm";
      include viewFile;
      include "/views/templates/footer.cfm";
    } else {
      throw("File not found: " & filePath);
    }
  }

  /**
   * Instansiasikan model, mis. model("em.EmployeeModel").
   */
  function model(modelFile) {
    var modelPath = "/models/#replace(modelFile, ".", "/", "all")#.cfc";
    if (fileExists(expandPath(modelPath))) {
      return createObject("component", "models.#modelFile#");
    } else {
      throw("File not found: " & modelPath);
    }
  }

  /**
   * Redirect ke URL relatif terhadap application.baseURL.
   */
  function redirect(pathUrl) {
    cflocation(url = application.baseURL & pathUrl, addToken = false);
  }

}`,
      explain: [
        '<code>view("emp.index", { data: content })</code> merender <code>/views/emp/index.cfm</code> dengan variabel <code>data</code> yang sudah tersedia.',
        'Penamaan bertitik (emp.index) memetakan ke subfolder — sama seperti penamaan komponen CFML.',
        'Pemeriksaan <code>fileExists()</code> mengubah error "include gagal" menjadi pesan yang mudah dipahami.',
        '<code>redirect()</code> selalu memakai <code>application.baseURL</code> dari .env — link tetap benar walau domain berubah.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Flash Message — Umpan Balik Sekali Tampil</h3><p>Setelah user submit form, kamu ingin menampilkan "Data berhasil ditambahkan" — tapi tidak di halaman POST itu sendiri (yang seharusnya redirect), melainkan di halaman tujuan berikutnya. Pola ini namanya <b>flash message</b>: pesan disimpan di <code>session</code>, dibaca sekali saat halaman tujuan tampil, lalu dihapus otomatis sehingga tidak muncul dua kali saat refresh.</p>'
    },
    {
      type: 'example',
      title: 'core/Message.cfc — flash & getFlash',
      lang: 'cfml',
      output: false,
      code: `component extends="core.Validation" {

  public void function flash(type, message, data = {}) {
    session.flash = {
      type    = type,      // success, danger, warning, info
      message = message,
      data    = data       // data pendukung, mis. isi form yang gagal
    };
  }

  public struct function getFlash() {
    var flash = structNew();
    if (structKeyExists(session, "flash")) {
      flash = duplicate(session.flash);
      structDelete(session, "flash");   // hapus setelah dibaca
    }
    return flash;
  }

}`,
      explain: [
        '<code>type</code> dipetakan langsung ke class Bootstrap: <code>alert-success</code>, <code>alert-danger</code>, dll.',
        'Struktur <code>data</code> membawa isi form yang gagal validasi sehingga input user tidak hilang percuma.',
        '<code>structDelete()</code> setelah dibaca membuat pesan benar-benar tampil hanya sekali.',
        'Kelas induk <code>core.Validation</code> menyambungkan rantai: BaseController → Message → Validation.'
      ]
    },
    {
      type: 'example',
      title: 'View memakai flash — views/emp/index.cfm',
      lang: 'cfml',
      output: false,
      code: `<cfoutput>
  <div class="container mt-5">
    <cfset var message = new core.Message()>
    <cfset var flash = message.getFlash()>

    <cfif structKeyExists(flash, "type")>
      <div class="alert alert-#flash.type# alert-dismissible fade show" role="alert">
        #flash.message#
        <button type="button" class="btn-close"
                data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    </cfif>

    <h3>Daftar Employee</h3>
    <table class="table table-striped">
      <tbody>
        <cfloop array="#data#" index="i">
          <tr>
            <td>#encodeForHTML(i.name)#</td>
            <td>#encodeForHTML(i.email)#</td>
            <td>#i.age#</td>
          </tr>
        </cfloop>
      </tbody>
    </table>
  </div>
</cfoutput>`,
      explain: [
        '<code>new core.Message()</code> dibuat di view karena method <code>getFlash()</code> dipanggil dari konteks include, bukan dari controller.',
        'Kondisi <code>structKeyExists(flash, "type")</code> memastikan alert hanya dirender bila ada pesan.',
        '<code>encodeForHTML()</code> pada setiap data user mencegah XSS — kebiasaan yang dibiasakan sejak awal.'
      ]
    },
    {
      type: 'warn',
      title: 'Selalu encode data user',
      text: 'Setiap nilai yang datang dari input user, URL, atau database harus melewati <code>encodeForHTML()</code> saat ditampilkan (dan <code>encodeForHTMLAttribute()</code> di dalam atribut HTML). Satu sel yang terlewat bisa membuka celah XSS yang menyerang sesi pengunjung lain.'
    },
    {
      type: 'text',
      html: '<h3>Controller Aplikasi Pertama</h3><p>Dengan seluruh helper siap, controller aplikasi menjadi ringkas dan terbaca. Perhatikan alur khas setiap method: validasi → panggil model → flash → redirect. Pola <b>POST/Redirect/GET</b> ini mencegah refresh ganda menyimpan data dua kali.</p>'
    },
    {
      type: 'example',
      title: 'controllers/em/EmployeeController.cfc — alur CRUD',
      lang: 'cfml',
      output: false,
      code: `component extends="core.BaseController" {

  variables.emp = model("em.EmployeeModel");

  variables.rules = {
    name  : "required|min:3|max:20",
    email : "required|is_email|max:50",
    age   : "required|is_numeric"
  };

  // GET /employee — daftar semua data
  public any function getAll() {
    var content = [];
    try {
      content = variables.emp.getAllData();
    } catch (any exName) {
      flash("danger", exName.message);
    }
    view("emp.index", { data: content });
  }

  // POST /employee — simpan data baru
  public any function createData(content = {}) {
    var result  = validate(content, variables.rules);
    var retData = {
      name  : val(content.name),
      email : val(content.email),
      age   : val(content.age)
    };

    if (!result.success) {
      flash("danger", result.errors[1], retData);
      redirect("/employee/add");
      return;
    }

    try {
      variables.emp.createData(content);
      flash("success", "Data berhasil ditambahkan");
      redirect("/employee");
    } catch (any exName) {
      flash("danger", exName.message, retData);
      redirect("/employee/add");
    }
  }

}`,
      explain: [
        '<code>model()</code> dipanggil di body komponen sehingga instance model tersedia untuk seluruh method controller.',
        'Struct <code>rules</code> menyimpan aturan validasi per field — didefinisikan sekali, dipakai berulang.',
        'Percabangan gagal validasi mengembalikan <code>retData</code> berisi isi form user, sehingga form terisi kembali otomatis.',
        'Blok <code>try/catch</code> mengubah pesan exception database menjadi flash danger yang ramah — error teknis tidak bocor ke user.'
      ]
    },
    {
      type: 'tip',
      title: 'Kenapa redirect setelah POST?',
      text: 'Tanpa redirect, refresh halaman akan mengulang POST dan menyimpan data dua kali. Dengan <b>POST/Redirect/GET</b>, browser memuat ulang lewat GET — data aman, dan halaman tujuan bisa di-refresh sesukanya. Inilah alasan flash message dibutuhkan: menjadi jembatan pesan antara dua request.'
    },
    {
      type: 'text',
      html: '<h3>Helper Upload File</h3><p>Terakhir, BaseController menyediakan <code>upload()</code> yang membungkus <code>fileUpload()</code>: file dipindahkan ke folder tujuan lalu diganti nama dengan UUID — nama asli tidak pernah sampai ke server, sehingga nama berbahaya atau tabrakan antar file tidak mungkin terjadi.</p>'
    },
    {
      type: 'example',
      title: 'upload() — aman dan ber-UUID',
      lang: 'cfml',
      output: false,
      code: `function upload(path, file) {
  var uploadDir = arguments.path;

  if (!directoryExists(uploadDir)) {
    directoryCreate(uploadDir);
  }

  var uploadedFile = fileUpload(
    destination = uploadDir,
    fileField   = arguments.file,
    mode        = "makeunique"
  );

  var fileExt  = listLast(uploadedFile.serverFile, ".");
  var uuidName = createUUID() & "." & fileExt;

  fileMove(
    source      = uploadedFile.serverDirectory & "/" & uploadedFile.serverFile,
    destination = uploadDir & uuidName
  );

  return uuidName;
}`,
      explain: [
        '<code>mode="makeunique"</code> membuat Lucee menamai file sementara unik — tabrakan nama tidak mungkin terjadi.',
        'Ekstensi file asli dipertahankan agar browser tetap tahu tipe file saat menampilkannya.',
        'Nama UUID mengaburkan informasi (jumlah upload, penamaan asli) dan mencegah file overwrite sesama user.'
      ]
    },
    {
      type: 'vocab',
      items: [
        ['BaseController', 'Komponen induk berisi helper bersama (view, model, redirect, upload) yang diwarisi semua controller.'],
        ['Layout', 'Template header & footer yang membungkus setiap view sehingga tampilan konsisten antar halaman.'],
        ['Flash message', 'Pesan yang disimpan di session, tampil sekali di halaman tujuan, lalu otomatis dihapus.'],
        ['POST/Redirect/GET', 'Pola menangani submit: proses POST, redirect ke URL GET lain — mencegah duplikasi saat refresh.'],
        ['XSS', 'Cross-Site Scripting — penyisipan script lewat input user; dicegah dengan encodeForHTML().'],
        ['include', 'Tag CFML yang menyisipkan file .cfm lain beserta variabel halaman yang sedang berjalan.']
      ]
    }
  ],
  recap: [
    'BaseController adalah induk semua controller: view(), model(), redirect(), upload(), dan env().',
    'view() menyuntikkan struct data sebagai variabel lalu include header → view → footer sehingga HTML utuh dengan layout konsisten.',
    'Flash message disimpan di session oleh flash(), dibaca sekali oleh getFlash() yang menghapusnya setelah tampil.',
    'Alur khas controller: validasi → panggil model → flash → redirect (pola POST/Redirect/GET).',
    'encodeForHTML() wajib pada setiap data user yang ditampilkan untuk mencegah XSS.',
    'upload() menamai file dengan UUID dan menolak nama asli — aman dari tabrakan dan overwrite.'
  ]
});
