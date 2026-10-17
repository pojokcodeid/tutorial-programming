/**
 * Validation — validasi input bergaya Laravel.
 * Aturan ditulis sebagai string: "required|is_email|max:50"
 */
component {

	public struct function validate(required struct data, required struct rules) {
		var errors = [];

		for (var field in rules) {
			var ruleSet  = listToArray(rules[field], "|");
			var value    = structKeyExists(data, field) ? data[field] : "";

			for (var rule in ruleSet) {
				var valid     = true;
				var ruleName  = rule;
				var ruleParam = "";

				// Aturan berparameter, mis. min:3
				if (find(":", rule)) {
					var parts    = listToArray(rule, ":");
					ruleName     = parts[1];
					ruleParam    = parts[2];
				}

				switch (ruleName) {
					case "required":
						valid = structKeyExists(data, field) && len(trim(value)) > 0;
						if (!valid) arrayAppend(errors, "#field# wajib diisi.");
						break;

					case "is_email":
						valid = isValid("email", value);
						if (!valid) arrayAppend(errors, "#field# harus berupa email yang valid.");
						break;

					case "is_numeric":
						valid = isNumeric(value);
						if (!valid) arrayAppend(errors, "#field# harus berupa angka.");
						break;

					case "min":
						valid = len(trim(value)) >= val(ruleParam);
						if (!valid) arrayAppend(errors, "#field# minimal #ruleParam# karakter.");
						break;

					case "max":
						valid = len(trim(value)) <= val(ruleParam);
						if (!valid) arrayAppend(errors, "#field# maksimal #ruleParam# karakter.");
						break;

					case "is_date":
						valid = isDate(value);
						if (!valid) arrayAppend(errors, "#field# harus berupa tanggal yang valid.");
						break;

					case "is_url":
						valid = isUrl(value);
						if (!valid) arrayAppend(errors, "#field# harus berupa URL yang valid.");
						break;

					case "strong_password":
						valid = len(value) >= 8
							 && reFind("[A-Z]", value)
							 && reFind("[a-z]", value)
							 && reFind("[0-9]", value)
							 && reFind("[^A-Za-z0-9]", value);
						if (!valid) {
							arrayAppend(errors, "#field# harus kuat (min 8 karakter, huruf besar, kecil, angka, dan simbol).");
						}
						break;

					// Tambahkan aturan baru di sini…
					default:
						// Aturan tidak dikenal — abaikan
				}

				if (!valid) break;
			}
		}

		return {
			success = arrayLen(errors) == 0,
			errors  = errors
		};
	}

}
