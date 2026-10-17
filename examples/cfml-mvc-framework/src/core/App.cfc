/**
 * App — mesin routing front-controller framework MVC.
 *
 * URL datang dari hasil URL rewrite sebagai url.page, lalu dicocokkan
 * dengan daftar route (method + pola path). Pola ":nama" menandai
 * parameter URL, mis. /employee/edit/:id
 */
component {

	property array  params;
	property array  paramsVariables;
	property array  handlers;
	property string controllerFile;
	property string controllerMethod;

	public function init() {
		variables.controllerFile    = "Default";
		variables.controllerMethod  = "index";
		variables.params            = [];
		variables.paramsVariables   = [];
		variables.handlers          = [];
		return this;
	}

	public function setDefaultController(string controllerFile) {
		variables.controllerFile = controllerFile;
	}

	public function setDefaultControllerMethod(string controllerMethod) {
		variables.controllerMethod = controllerMethod;
	}

	public function get(string uri, any callback) {
		setHandler("GET", uri, callback);
	}

	public function post(string uri, any callback) {
		setHandler("POST", uri, callback);
	}

	public function put(string uri, any callback) {
		setHandler("PUT", uri, callback);
	}

	public function delete(string uri, any callback) {
		setHandler("DELETE", uri, callback);
	}

	private function setHandler(string method, string path, any handler) {
		arrayAppend(variables.handlers, {
			path    = path,
			method  = method,
			handler = handler
		});
	}

	/**
	 * Cari route yang cocok, lalu panggil method controller sesuai.
	 */
	public function run() {
		// url.page adalah hasil rewrite: "/employee/edit/12"
		var urlPage    = structKeyExists(url, "page") ? trim(url.page) : "";
		var httpMethod = ucase(cgi.request_method);

		// Pastikan tidak ada sisa parameter dari percobaan sebelumnya
		variables.params          = [];
		variables.paramsVariables = [];

		for (var handler in variables.handlers) {
			var routeSegments = listToArray(handler.path, "/");
			var pageSegments  = len(urlPage) ? listToArray(urlPage, "/") : [];

			// Panjang segmen harus sama agar route cocok
			if (arrayLen(routeSegments) != arrayLen(pageSegments)) {
				continue;
			}

			// Cocokkan tiap segmen; ":id" menangkap nilai apa pun
			variables.params          = [];
			variables.paramsVariables = [];
			var isMatch               = true;

			for (var i = 1; i <= arrayLen(routeSegments); i++) {
				var segment = routeSegments[i];
				if (left(segment, 1) == ":") {
					// Parameter URL — simpan nama & nilainya
					arrayAppend(variables.paramsVariables, mid(segment, 2, len(segment)));
					arrayAppend(variables.params, pageSegments[i]);
				} else if (segment != pageSegments[i]) {
					isMatch = false;
					break;
				}
			}

			if (isMatch && httpMethod == handler.method) {
				variables.controllerFile   = handler.handler.controller;
				variables.controllerMethod = handler.handler.method;
				break;
			}
		}

		// Tangani kiriman JSON body (dipakai oleh REST API)
		var content = {};
		if (len(trim(getHttpRequestData().content))) {
			try {
				content = deserializeJSON(getHttpRequestData().content);
			} catch (any e) {
				content = form; // fallback ke form biasa bila bukan JSON valid
			}
			arrayAppend(variables.paramsVariables, "content");
			arrayAppend(variables.params, content);
		}

		var controllerPath = "/controllers/#replace(variables.controllerFile, ".", "/", "all")#.cfc";
		if (!fileExists(expandPath(controllerPath))) {
			return {
				success = false,
				message = "Controller `#variables.controllerFile#` not found."
			};
		}

		var controller = createObject("component", "controllers.#variables.controllerFile#");

		if (!structKeyExists(controller, variables.controllerMethod)) {
			return {
				success = false,
				message = "Method `#variables.controllerMethod#` not found in controller `#variables.controllerFile#`."
			};
		}

		return controller[variables.controllerMethod](argumentCollection = paramsToStruct(variables.params));
	}

	// Ubah array params menjadi struct sesuai nama parameter route
	private function paramsToStruct(array params) {
		var s = {};
		for (var i = 1; i <= arrayLen(arguments.params); i++) {
			s[variables.paramsVariables[i]] = arguments.params[i];
		}
		return s;
	}

}
