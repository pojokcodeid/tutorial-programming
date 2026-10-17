/**
 * EmployeeController — contoh controller CRUD lengkap:
 * list, tambah, ubah, hapus, beserta validasi & upload lampiran.
 */
component extends="core.BaseController" {

	variables.emp = model("em.EmployeeModel");

	variables.rules = {
		name  : "required|min:3|max:20",
		email : "required|is_email|max:50",
		age   : "required|is_numeric"
	};

	public function init() {
		return this;
	}

	// GET /employee/say-hay
	public any function sayHay() {
		return variables.emp.sayHay();
	}

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

	// GET /employee/add — form tambah
	public any function addNew() {
		view("emp.add");
	}

	// GET /employee/edit/:id — form ubah
	public any function getById(id) {
		var content = {};
		try {
			content = variables.emp.getById(id);
		} catch (any exName) {
			flash("danger", exName.message);
		}
		view("emp.edit", { data: content });
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
			if (structKeyExists(content, "lampiran") && len(trim(content.lampiran))) {
				var uploadPath = "/" & env("UPLOAD_DIR", "public/uploads") & "/";
				content.lampiran = upload(expandPath(uploadPath), content.lampiran);
			}
			variables.emp.createData(content);
			flash("success", "Data berhasil ditambahkan");
			redirect("/employee");
		} catch (any exName) {
			flash("danger", exName.message, retData);
			redirect("/employee/add");
		}
	}

	// POST /employee/edit/:id — perbarui data
	public any function updateData(id, content = {}) {
		var result = validate(content, variables.rules);
		var retData = {
			id         : id,
			name       : val(content.name),
			email      : val(content.email),
			age        : val(content.age),
			attachment : val(content.lampiran)
		};

		if (!result.success) {
			flash("danger", result.errors[1], retData);
			redirect("/employee/edit/" & id);
			return;
		}

		try {
			content.id = id;

			// Pastikan data masih ada
			var data = variables.emp.getById(id);
			if (!structKeyExists(data, "id")) {
				flash("danger", "Data tidak ditemukan");
				redirect("/employee");
				return;
			}

			// Ganti lampiran bila ada file baru yang diunggah
			if (structKeyExists(content, "lampiran") && len(trim(content.lampiran))) {
				var uploadPath = "/" & env("UPLOAD_DIR", "public/uploads") & "/";
				if (structKeyExists(data, "attachment") && len(trim(data.attachment))) {
					var fileToDelete = expandPath(uploadPath) & data.attachment;
					if (fileExists(fileToDelete)) {
						fileDelete(fileToDelete);
					}
				}
				content.lampiran = upload(expandPath(uploadPath), content.lampiran);
			}

			variables.emp.updateData(content);
			flash("success", "Data berhasil diperbarui");
			redirect("/employee");
		} catch (any exName) {
			flash("danger", exName.message, retData);
			redirect("/employee/edit/" & id);
		}
	}

	// GET /employee/delete/:id — hapus data
	public any function deleteData(id) {
		try {
			var data = variables.emp.getById(id);
			if (!structKeyExists(data, "id")) {
				flash("danger", "Data tidak ditemukan");
				redirect("/employee");
				return;
			}

			// Hapus file lampiran bila ada
			if (structKeyExists(data, "attachment") && len(trim(data.attachment))) {
				var uploadPath = "/" & env("UPLOAD_DIR", "public/uploads") & "/";
				var fileToDelete = expandPath(uploadPath) & data.attachment;
				if (fileExists(fileToDelete)) {
					fileDelete(fileToDelete);
				}
			}

			var result = variables.emp.deleteData(id);
			if (result.id != 0) {
				flash("success", "Data berhasil dihapus");
			} else {
				flash("danger", "Data gagal dihapus");
			}
			redirect("/employee");
		} catch (any exName) {
			flash("danger", exName.message);
			redirect("/employee");
		}
	}

}
