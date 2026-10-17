/**
 * Application.cfc — titik masuk konfigurasi Lucee.
 *
 * PERUBAHAN PENTING dibanding versi awal framework:
 * konfigurasi (datasource, baseURL, dll) dibaca dari file .env
 * lewat core.Env, bukan lagi dari configs/global.json.
 */
component {

	// ------------------------------------------------------------------
	// Muat .env dari root proyek (satu tingkat di atas webroot src/)
	// ------------------------------------------------------------------
	variables.envFile = getDirectoryFromPath(getCurrentTemplatePath()) & "../.env";
	variables.env     = new core.Env().load(variables.envFile);

	if (!structKeyExists(variables.env, "APP_NAME")) {
		writeOutput("
			<h2>File .env tidak ditemukan</h2>
			<p>Salin <code>.env.example</code> menjadi <code>.env</code> di root proyek
			lalu isi nilainya, kemudian jalankan ulang server:
			<code>box server restart</code></p>
		");
		abort;
	}

	this.name              = variables.env.APP_NAME;
	this.applicationTimeout = createTimeSpan(0, 2, 0, 0);
	this.sessionManagement  = true;
	this.sessionTimeout     = createTimeSpan(0, 0, 30, 0);

	// ------------------------------------------------------------------
	// Datasource dibangun dari nilai .env — tidak ada kredensial
	// yang menetap di dalam kode.
	// ------------------------------------------------------------------
	variables.datasourceName = "appDB";

	this.datasources[variables.datasourceName] = {
		class              : variables.env.DB_DRIVER_CLASS,
		connectionString   : "jdbc:#variables.env.DB_TYPE#://#variables.env.DB_HOST#:#variables.env.DB_PORT#/#variables.env.DB_NAME#?characterEncoding=UTF-8",
		username           : variables.env.DB_USER,
		password           : variables.env.DB_PASSWORD,
		connectionLimit    : val(variables.env.DB_CONNECTION_LIMIT)
	};
	this.datasource = variables.datasourceName;

	function onApplicationStart() {
		// Bagikan konfigurasi ke seluruh aplikasi lewat application scope
		application.env      = variables.env;
		application.baseURL  = variables.env.APP_URL;
		return true;
	}

	function onRequestStart(string targetPage) {
	}

	this.onError = function(exception, eventname) {
		var uuid  = createUUID();
		var sep   = findNoCase("Windows", server.OS.Name) ? chr(92) : "/";
		var logs  = getDirectoryFromPath(getCurrentTemplatePath()) & ".." & sep & "logs";

		if (!directoryExists(logs)) {
			directoryCreate(logs);
		}

		savecontent variable="strDump" {
			writeDump(var = exception, label = "Exception", format = "html");
		}

		try {
			fileWrite(logs & sep & uuid & ".html", strDump);
		} catch (any writeErr) {
			log text = "Error while writing error file: #writeErr.message#" file = "mvcErrorHandler";
		}

		cfheader(statuscode = "500", statustext = "Internal Server Error");

		// Di produksi (APP_DEBUG=false) jangan tampilkan detail exception
		if (structKeyExists(variables.env, "APP_DEBUG") && variables.env.APP_DEBUG == "true") {
			writeDump(var = exception, label = "Exception");
		} else {
			writeOutput("
				<h2>Ups! Terjadi kesalahan di server.</h2>
				<p>Hubungi admin dengan menyebutkan reference ID berikut:</p>
				<code>#uuid#</code>
			");
		}
		return false;
	}

}
