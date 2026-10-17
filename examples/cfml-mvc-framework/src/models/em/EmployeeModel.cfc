/**
 * EmployeeModel — akses data tabel `personal`.
 * Datasource dipakai bawaan (this.datasource dari Application.cfc),
 * sehingga model tidak perlu tahu kredensial database.
 */
component {

	public function init() {
		return this;
	}

	// Contoh endpoint ala API
	public struct function sayHay() {
		return {
			code    = 200,
			success = true,
			message = "Get Data Success",
			data    = { name = "Pojok Code" }
		};
	}

	// SELECT — semua data
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

	// SELECT — satu data berdasarkan id
	public struct function getById(required any id) {
		var qPersonal = queryExecute(
			"SELECT id, name, email, age, attachment FROM personal WHERE id = ?",
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

	// INSERT — tambah data (pakai named parameter & generatedKey)
	public struct function createData(required struct content) {
		var dataToInsert = {
			name       = { value = arguments.content.name,  sqltype = "CF_SQL_VARCHAR" },
			email      = { value = arguments.content.email, sqltype = "CF_SQL_VARCHAR" },
			age        = { value = arguments.content.age,   sqltype = "CF_SQL_INTEGER" },
			attachment = { value = val(arguments.content.lampiran), sqltype = "CF_SQL_VARCHAR" }
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

	// UPDATE — ubah data
	public struct function updateData(required struct content) {
		var dataToUpdate = {
			id    = { value = arguments.content.id,    sqltype = "CF_SQL_INTEGER" },
			name  = { value = arguments.content.name,  sqltype = "CF_SQL_VARCHAR" },
			email = { value = arguments.content.email, sqltype = "CF_SQL_VARCHAR" },
			age   = { value = arguments.content.age,   sqltype = "CF_SQL_INTEGER" }
		};

		var sql = "UPDATE personal SET name = :name, email = :email, age = :age";

		if (structKeyExists(arguments.content, "lampiran") && len(arguments.content.lampiran)) {
			dataToUpdate.attachment = { value = arguments.content.lampiran, sqltype = "CF_SQL_VARCHAR" };
			sql &= ", attachment = :attachment";
		}
		sql &= " WHERE id = :id";

		queryExecute(sql, dataToUpdate);

		return {
			id    = arguments.content.id,
			name  = arguments.content.name,
			email = arguments.content.email,
			age   = arguments.content.age
		};
	}

	// DELETE — hapus data berdasarkan id
	public struct function deleteData(required any id) {
		queryExecute(
			"DELETE FROM personal WHERE id = ?",
			[arguments.id],
			{ result = "deleteResult" }
		);

		return { id = deleteResult.affectedRows ? arguments.id : 0 };
	}

}
