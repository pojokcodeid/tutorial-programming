/**
 * BaseController — induk semua controller.
 * Menyediakan helper: view(), model(), redirect(), upload(), dan env().
 */
component extends="core.Message" {

	function init() {
		return this;
	}

	/**
	 * Render view .cfm beserta layout header/footer.
	 * Isi struct `content` disuntikkan sebagai variabel di view.
	 */
	function view(filePath, content = {}) {
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
	 * Instansiasikan model berdasarkan nama, mis. model("em.EmployeeModel").
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

	/**
	 * Baca konfigurasi dari file .env yang sudah dimuat Application.cfc.
	 * Pemakaian: env("DB_NAME") atau env("APP_URL", "http://localhost")
	 */
	function env(string key, string defaultValue = "") {
		return new core.Env().get(application.env, key, defaultValue);
	}

	/**
	 * Upload satu file ke folder tujuan, rename dengan nama UUID.
	 * Mengembalikan nama file baru.
	 */
	function upload(path, file) {
		var uploadDir = arguments.path;

		if (!directoryExists(uploadDir)) {
			directoryCreate(uploadDir);
		}

		var uploadedFile = fileUpload(
			destination = uploadDir,
			fileField   = arguments.file,
			mode        = "makeunique"
		);

		var fileExt = listLast(uploadedFile.serverFile, ".");
		var uuidName = createUUID() & "." & fileExt;

		fileMove(
			source      = uploadedFile.serverDirectory & "/" & uploadedFile.serverFile,
			destination = uploadDir & uuidName
		);

		return uuidName;
	}

}
