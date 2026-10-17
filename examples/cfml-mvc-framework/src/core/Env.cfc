/**
 * Env — pembaca file .env sederhana untuk Lucee CFML.
 *
 * Konfigurasi aplikasi tidak lagi disimpan di configs/global.json,
 * melainkan di file .env di root proyek (tidak ikut di-commit ke git).
 *
 * Format .env yang didukung:
 *   # komentar
 *   KEY=nilai
 *   KEY="nilai dengan spasi"
 *   KEY='nilai lain'
 */
component {

	/**
	 * Memuat file .env menjadi struct. Key selalu di-uppercase.
	 * Bila file tidak ditemukan, mengembalikan struct kosong.
	 */
	public struct function load(required string filePath) {
		var result = {};

		if (!fileExists(arguments.filePath)) {
			return result;
		}

		var lines = listToArray(fileRead(arguments.filePath), chr(10), true);

		for (var line in lines) {
			line = trim(line);

			// Lewati baris kosong dan komentar (# atau //)
			if (!len(line)) continue;
			if (left(line, 1) == chr(35)) continue;
			if (left(line, 2) == "//") continue;

			// Lewati baris yang bukan pasangan KEY=nilai
			if (!find("=", line)) continue;

			var key   = ucase(trim(listFirst(line, "=")));
			var value = trim(listRest(line, "="));

			// Buang pasangan kutip di ujung nilai ("..." atau '...')
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

	/**
	 * Ambil satu nilai dari struct env dengan fallback nilai default.
	 */
	public string function get(required struct env, required string key, string defaultValue = "") {
		var k = ucase(arguments.key);
		return structKeyExists(arguments.env, k) ? arguments.env[k] : arguments.defaultValue;
	}

}
