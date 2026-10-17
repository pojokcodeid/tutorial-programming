/**
 * Message — pesan flash (pesan sekali tampil) lewat session.
 */
component extends="core.Validation" {

	public void function flash(type, message, data = {}) {
		session.flash = {
			type    = type,
			message = message,
			data    = data
		};
	}

	public struct function getFlash() {
		var flash = structNew();
		if (structKeyExists(session, "flash")) {
			flash = duplicate(session.flash);
			structDelete(session, "flash");
		}
		return flash;
	}

}
