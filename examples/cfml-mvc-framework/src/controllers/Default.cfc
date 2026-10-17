/**
 * Default — controller bawaan (halaman 404 / beranda).
 */
component extends="core.BaseController" {

	public function init() {
		return this;
	}

	public void function index() {
		// Halaman awal aplikasi: arahkan ke daftar employee
		redirect("/employee");
	}

}
