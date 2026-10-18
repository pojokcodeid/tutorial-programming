/* ============================================================
   Pelajaran Framework MVC (Lucee CFML) — Bab 5: Model & Validasi (M5)
   ============================================================ */
'use strict';

window.LUCEEMVC_LESSONS = window.LUCEEMVC_LESSONS || [];

window.LUCEEMVC_LESSONS.push({
  id: 'mvc-model-validasi',
  title: 'Model, Query Aman & Validasi Input',
  chapter: 'Proyek Praktis: Framework MVC',
  duration: '16 menit',
  intro: [
    'Lapisan terakhir framework: <b>Model</b> — satu-satunya tempat yang boleh menyentuh database — dan <b>Validation</b>, penjaga gerbang input yang memastikan data yang masuk bersih sebelum query dijalankan.',
    'Pelajaran ini menulis <code>EmployeeModel</code> dengan <code>queryExecute()</code> + parameter binding, membangun komponen <code>Validation.cfc</code> bergaya Laravel (<code>"required|is_email|max:50"</code>), lalu merangkai semuanya menjadi modul CRUD lengkap.'
  ],
  objectives: [
    'Menulis model dengan queryExecute() dan parameter binding (named & positional)',
    'Membaca generatedKey dan affectedRows dari struct result',
    'Mengubah array query menjadi array struct untuk dikonsumsi view',
    'Membangun Validation.cfc dengan aturan string berkonsep pipe',
    'Menangani aturan berparameter seperti min:3 dan max:50',
    'Merangkai validasi → model → flash dalam alur CRUD controller'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Prinsip Model</h3><p>Model adalah satu-satunya lapisan yang tahu bentuk tabel. Ketika skema database berubah (kolom <code>age</code> menjadi <code>age_years</code>), hanya file model yang disentuh — controller dan view tetap utuh karena berbicara dalam bahasa struct, bukan kolom. Prinsip ini disebut <b>separation of concerns</b> dan menjadi alasan framework MVC tetap terjaga saat proyek tumbuh.</p>'
    },
    {
      type: 'text',
      html: '<h3>queryExecute() dan Parameter Binding</h3><p>Fungsi <code>queryExecute(sql, params, options)</code> adalah cara modern menjalankan query di cfscript. Selalu gunakan <b>parameter binding</b> — positional (<code>?</code>) atau named (<code>:nama</code>) — untuk setiap nilai dinamis. Nilai terikat parameter dikirim terpisah dari struktur SQL, sehingga injection mustahil terjadi dan tipe data ditangani driver JDBC.</p>'
    },
    {
      type: 'example',
      title: 'EmployeeModel — SELECT dan DELETE',
      lang: 'cfml',
      output: false,
      code: `component {

  public function init() {
    return this;
  }

  // SELECT — semua data, diubah menjadi array struct
  public array function getAllData() {
    var personals = [];
    var qPersonal = queryExecute(
      "SELECT id, name, email, age FROM personal ORDER BY id DESC"
    );

    for (var p in qPersonal) {
      arrayAppend(personals, {
        id    = p.id,
        name  = p.name,
        email = p.email,
        age   = p.age
      });
    }
    return personals;
  }

  // SELECT — satu data berdasarkan id (positional binding)
  public struct function getById(required any id) {
    var qPersonal = queryExecute(
      "SELECT id, name, email, age, attachment
       FROM personal WHERE id = ?",
      [arguments.id]
    );

    if (qPersonal.recordCount) {
      return {
        id         = qPersonal.id,
        name       = qPersonal.name,
        email      = qPersonal.email,
        age        = qPersonal.age,
        attachment = qPersonal.attachment
      };
    }
    return {};
  }

  // DELETE — kembalikan id bila ada baris terpengaruh
  public struct function deleteData(required any id) {
    queryExecute(
      "DELETE FROM personal WHERE id = ?",
      [arguments.id],
      { result = "deleteResult" }
    );

    return { id = deleteResult.affectedRows ? arguments.id : 0 };
  }

}`,
      explain: [
        'Query dikonversi menjadi array struct di dalam model — controller tidak pernah memegang objek query.',
        'Array <code>[arguments.id]</code> mengisi tanda <code>?</code> secara berurutan (positional binding).',
        'Opsi <code>{ result = "deleteResult" }</code> membuat struct <code>deleteResult</code> tersedia berisi <code>affectedRows</code>.',
        'Mengembalikan <code>id = 0</code> bila tidak ada baris terhapus memberi sinyal kegagalan tanpa exception.'
      ]
    },
    {
      type: 'example',
      title: 'EmployeeModel — INSERT dengan named parameter & generatedKey',
      lang: 'cfml',
      output: false,
      code: `public struct function createData(required struct content) {
  var dataToInsert = {
    name  = { value = arguments.content.name,  sqltype = "CF_SQL_VARCHAR" },
    email = { value = arguments.content.email, sqltype = "CF_SQL_VARCHAR" },
    age   = { value = arguments.content.age,   sqltype = "CF_SQL_INTEGER" },
    attachment = {
      value  = val(arguments.content.lampiran),
      sqltype = "CF_SQL_VARCHAR"
    }
  };

  queryExecute(
    "INSERT INTO personal (name, email, age, attachment)
     VALUES (:name, :email, :age, :attachment)",
    dataToInsert,
    { result = "insertResult" }
  );

  return {
    id    = val(insertResult.generatedKey),
    name  = arguments.content.name,
    email = arguments.content.email,
    age   = arguments.content.age
  };
}

// UPDATE — kolom attachment hanya ditambahkan bila ada file baru
public struct function updateData(required struct content) {
  var dataToUpdate = {
    id    = { value = arguments.content.id,    sqltype = "CF_SQL_INTEGER" },
    name  = { value = arguments.content.name,  sqltype = "CF_SQL_VARCHAR" },
    email = { value = arguments.content.email, sqltype = "CF_SQL_VARCHAR" },
    age   = { value = arguments.content.age,   sqltype = "CF_SQL_INTEGER" }
  };

  var sql = "UPDATE personal SET name = :name, email = :email, age = :age";

  if (structKeyExists(arguments.content, "lampiran")
      && len(arguments.content.lampiran)) {
    dataToUpdate.attachment = {
      value  = arguments.content.lampiran,
      sqltype = "CF_SQL_VARCHAR"
    };
    sql &= ", attachment = :attachment";
  }
  sql &= " WHERE id = :id";

  queryExecute(sql, dataToUpdate);

  return { id = arguments.content.id, name = arguments.content.name };
}`,
      explain: [
        'Named parameter (<code>:name</code>) lebih terbaca daripada berkas positional panjang, dan bisa dipakai ulang dalam satu query.',
        '<code>sqltype</code> eksplisit membuat driver mengirim nilai dengan tipe yang tepat — angka benar-benar angka.',
        '<code>insertResult.generatedKey</code> berisi id auto-increment hasil INSERT — dikembalikan ke controller untuk konfirmasi.',
        'String SQL disusun dinamis: kolom <code>attachment</code> ikut di-UPDATE hanya bila user mengunggah file baru.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Validation.cfc — Gerbang Input</h3><p>Validasi tidak boleh berdiri di controller saja — ia butuh format yang mudah diperluas dan konsisten. Kami memakai gaya Laravel: aturan ditulis sebagai string berkonsep pipe, misal <code>"required|is_email|max:50"</code>, lalu diurai dan dieksekusi satu per satu oleh method <code>validate()</code>.</p>'
    },
    {
      type: 'example',
      title: 'core/Validation.cfc — mesin aturan',
      lang: 'cfml',
      output: false,
      code: `component {

  public struct function validate(
    required struct data,
    required struct rules
  ) {
    var errors = [];

    for (var field in rules) {
      var ruleSet = listToArray(rules[field], "|");
      var value   = structKeyExists(data, field) ? data[field] : "";

      for (var rule in ruleSet) {
        var valid     = true;
        var ruleName  = rule;
        var ruleParam = "";

        // Aturan berparameter, mis. min:3
        if (find(":", rule)) {
          var parts     = listToArray(rule, ":");
          ruleName      = parts[1];
          ruleParam     = parts[2];
        }

        switch (ruleName) {
          case "required":
            valid = structKeyExists(data, field) && len(trim(value)) > 0;
            if (!valid) arrayAppend(errors, "#field# wajib diisi.");
            break;

          case "is_email":
            valid = isValid("email", value);
            if (!valid) arrayAppend(errors, "#field# harus email valid.");
            break;

          case "is_numeric":
            valid = isNumeric(value);
            if (!valid) arrayAppend(errors, "#field# harus angka.");
            break;

          case "min":
            valid = len(trim(value)) >= val(ruleParam);
            if (!valid)
              arrayAppend(errors, "#field# minimal #ruleParam# karakter.");
            break;

          case "max":
            valid = len(trim(value)) <= val(ruleParam);
            if (!valid)
              arrayAppend(errors, "#field# maksimal #ruleParam# karakter.");
            break;

          // Tambahkan aturan baru di sini…
          default:
            // Aturan tidak dikenal — abaikan
        }

        if (!valid) break;   // satu kesalahan per field cukup
      }
    }

    return {
      success = arrayLen(errors) == 0,
      errors  = errors
    };
  }

}`,
      explain: [
        '<code>listToArray(rules[field], "|")</code> mengubah string aturan menjadi array yang mudah diiterasi.',
        'Pemisah <code>:</code> memisahkan nama aturan dari parameternya: <code>min:3</code> → nama <code>min</code>, parameter <code>3</code>.',
        '<code>switch</code> dengan <code>default</code> diam mengabaikan aturan tak dikenal — aturan lama tetap aman meski aturan dihapus dari framework.',
        'Return value dua bagian: <code>success</code> sebagai saklar, <code>errors</code> sebagai daftar pesan siap tampil.'
      ]
    },
    {
      type: 'tip',
      title: 'Mengembangkan Validation',
      text: 'Menambah aturan baru cukup satu case: mis. <code>case "is_alpha":</code> dengan <code>valid = reFind("^[a-zA-Z ]+$", value)</code>. Karena aturan dipanggil lewat string, controller yang sudah ada langsung bisa memakainya tanpa perubahan kode — hanya menambah <code>"is_alpha"</code> ke field <code>name</code> di struct rules.'
    },
    {
      type: 'text',
      html: '<h3>Merangkai Semuanya: Alur CRUD Lengkap</h3><p>Perhatikan urutan pada method <code>createData()</code> di controller — inilah kerangka yang dipakai berulang di seluruh modul framework-mu.</p>'
    },
    {
      type: 'example',
      title: 'Alur submit di EmployeeController',
      lang: 'cfml',
      output: false,
      code: `public any function createData(content = {}) {
  // 1. Validasi — berhenti lebih dulu bila ada yang salah
  var result  = validate(content, variables.rules);
  var retData = {
    name  : val(content.name),
    email : val(content.email),
    age   : val(content.age)
  };

  if (!result.success) {
    flash("danger", result.errors[1], retData);   // pesan pertama
    redirect("/employee/add");
    return;
  }

  // 2. Proses bisnis — upload (bila ada) lalu simpan lewat model
  try {
    if (structKeyExists(content, "lampiran")
        && len(trim(content.lampiran))) {
      var uploadPath = "/" & env("UPLOAD_DIR", "public/uploads") & "/";
      content.lampiran = upload(expandPath(uploadPath), content.lampiran);
    }

    variables.emp.createData(content);

    // 3. Sukses — konfirmasi + redirect (POST/Redirect/GET)
    flash("success", "Data berhasil ditambahkan");
    redirect("/employee");
  } catch (any exName) {
    // 4. Gagal — pesan kegagalan teknis + form terisi kembali
    flash("danger", exName.message, retData);
    redirect("/employee/add");
  }
}`,
      explain: [
        'Validasi mendahului segalanya — tidak ada query yang dijalankan untuk data yang rusak.',
        '<code>retData</code> membawa isi form user agar terisi kembali otomatis di halaman form.',
        'Tiga jalan keluar: gagal validasi, sukses, atau exception — masing-masing dengan flash dan tujuan redirect berbeda.',
        'Path upload dibaca dari <code>env("UPLOAD_DIR")</code> — konfigurasi, bukan hard-coded.'
      ]
    },
    {
      type: 'warn',
      title: 'Validasi di server bukan sekadar UX',
      text: 'Validasi HTML (atribut <code>required</code>, <code>type="email"</code>) hanya mempercantik form — siapa pun bisa mengirim request langsung ke endpoint-mu dengan curl. Validasi di <b>server</b> adalah satu-satunya pertahanan nyata; itulah mengapa <code>validate()</code> dipanggil di setiap method yang menerima input.'
    },
    {
      type: 'vocab',
      items: [
        ['queryExecute()', 'Fungsi cfscript untuk menjalankan SQL dengan parameter binding dan opsi result.'],
        ['Parameter binding', 'Mengirim nilai terpisah dari struktur SQL — mencegah SQL injection.'],
        ['Named parameter', 'Penanda <code>:nama</code> yang mengikat nilai berdasarkan nama, bukan urutan.'],
        ['generatedKey', 'Kunci pada struct result berisi id auto-increment hasil INSERT.'],
        ['affectedRows', 'Jumlah baris yang terpengaruh INSERT/UPDATE/DELETE — dipakai memverifikasi keberhasilan.'],
        ['Separation of concerns', 'Prinsip pemisahan tanggung jawab: model mengurus data, controller mengurus alur.']
      ]
    }
  ],
  recap: [
    'Model adalah satu-satunya lapisan yang menyentuh database; hasil query diubah menjadi array struct sebelum ke controller.',
    'queryExecute(sql, params, options) selalu memakai parameter binding — positional (?) atau named (:nama).',
    'struct result menyediakan generatedKey (id hasil INSERT) dan affectedRows (jumlah baris terpengaruh).',
    'Validation.cfc mengurai aturan string "required|is_email|max:50" lalu mengeksekusinya per field.',
    'Aturan berparameter memisah nama dan nilai dengan titik dua: min:3 → ruleName "min", ruleParam "3".',
    'Alur controller: validasi → upload/simpan via model → flash sukses → redirect; kegagalan memulihkan isi form lewat flash data.'
  ]
});
