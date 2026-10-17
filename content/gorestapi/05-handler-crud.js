/* ============================================================
   Pelajaran Go REST API — Bab 5: Handler CRUD & Routing
   ============================================================ */
'use strict';

window.GORESTAPI_LESSONS = window.GORESTAPI_LESSONS || [];

window.GORESTAPI_LESSONS.push({
  id: 'restapi-handler-crud',
  title: 'Handler CRUD, Routing & Validasi Request',
  chapter: 'REST API',
  duration: '13 menit',
  intro: [
    'Mulai Go 1.22, <code>net/http.ServeMux</code> sudah mendukung <b>method + path pattern</b> seperti <code>"GET /products/{id}"</code>. Dengan begini, REST API lengkap bisa dibangun tanpa framework pihak ketiga.',
    'Pelajaran ini merangkai endpoint CRUD produk: menerima request JSON, memvalidasi input, memanggil service, lalu membalas dengan JSON + status code yang tepat.'
  ],
  objectives: [
    'Mendaftarkan route dengan method + path pattern',
    'Membaca path parameter lewat r.PathValue',
    'Decode body JSON & menangani body yang rusak',
    'Mengirim respons JSON dengan status code tepat',
    'Memetakan error service ke status HTTP'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Routing Modern di net/http</h3><p>ServeMux versi baru memungkinkan pola <code>METHOD /path/{param}</code>. Method yang tidak cocok otomatis dibalas <b>405 Method Not Allowed</b> — kamu tidak perlu memeriksa <code>r.Method</code> satu per satu lagi.</p>'
    },
    {
      type: 'example',
      title: 'Mendaftarkan seluruh route produk',
      lang: 'go',
      output: false,
      code: `func New(auth service.AuthService, products service.ProductService) http.Handler {
    prodH := handler.NewProductHandler(products)

    mux := http.NewServeMux()

    // Route publik
    mux.HandleFunc("GET  /api/v1/products",       prodH.List)
    mux.HandleFunc("GET  /api/v1/products/{id}",  prodH.Get)

    // Route admin (dibungkus middleware — dibahas di bab keamanan)
    admin := ...
    admin.Handle("POST   /api/v1/products",       prodH.Create)
    admin.Handle("PUT    /api/v1/products/{id}",  prodH.Update)
    admin.Handle("DELETE /api/v1/products/{id}",  prodH.Delete)

    return mux
}`,
      explain: [
        '<code>{id}</code> adalah path parameter — nilainya bisa dibaca di handler.',
        'Satu pola per method+path → tidak ada lagi tumpang tindih routing.',
        'Method salah otomatis 405, path tidak dikenal otomatis 404.'
      ]
    },
    {
      type: 'example',
      title: 'Membaca path parameter & query string',
      lang: 'go',
      output: false,
      code: `func (h *ProductHandler) Get(w http.ResponseWriter, r *http.Request) {
    // r.PathValue("id") mengembalikan string, mis. "12"
    id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
    if err != nil {
        writeError(w, http.StatusBadRequest, "id tidak valid")
        return
    }

    product, err := h.products.Get(r.Context(), id)
    ...
}

func (h *ProductHandler) List(w http.ResponseWriter, r *http.Request) {
    // Query string: /products?page=2&limit=10
    page, _ := strconv.Atoi(r.URL.Query().Get("page"))
    limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
    ...
}`,
      explain: [
        '<code>r.PathValue("id")</code> selalu mengembalikan string → dikonversi dengan ParseInt.',
        '<code>r.URL.Query().Get()</code> membaca query string; kosong menghasilkan "" (Atoi → 0, disetel default oleh service).',
        'Selalu validasi konversi — path parameter berasal dari klien dan bisa berisi apa saja.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Decode & Encode JSON</h3><p>Body request dibaca dengan <code>json.NewDecoder(r.Body).Decode(&dst)</code>, dan respons dikirim dengan <code>json.NewEncoder(w).Encode(src)</code>. Selalu sertakan header <code>Content-Type: application/json</code>.</p>'
    },
    {
      type: 'example',
      title: 'Handler Create lengkap',
      lang: 'go',
      output: false,
      code: `func (h *ProductHandler) Create(w http.ResponseWriter, r *http.Request) {
    var in model.ProductInput
    if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
        writeError(w, http.StatusBadRequest,
            "body JSON tidak valid: "+err.Error())
        return
    }

    claims := middleware.ClaimsFromContext(r.Context())
    product, err := h.products.Create(r.Context(), claims.UserID, in)
    if err != nil {
        mapServiceError(w, err)
        return
    }
    writeJSON(w, http.StatusCreated, product) // 201
}`,
      explain: [
        'Decode gagal (JSON rusak) → 400 dengan pesan yang membantu pengembang API.',
        '<code>claims.UserID</code> diambil dari context (sudah diisi middleware) untuk mencatat pembuat produk.',
        'Sukses membuat resource baru membalas <b>201 Created</b>, bukan 200.'
      ]
    },
    {
      type: 'example',
      title: 'Helper respons JSON',
      lang: 'go',
      output: false,
      code: `func writeJSON(w http.ResponseWriter, status int, data any) {
    w.Header().Set("Content-Type", "application/json; charset=utf-8")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, message string) {
    writeJSON(w, status, map[string]string{"error": message})
}

// 204 No Content: sukses menghapus, tanpa body sama sekali
func (h *ProductHandler) Delete(w http.ResponseWriter, r *http.Request) {
    ...
    w.WriteHeader(http.StatusNoContent)
}`,
      explain: [
        'Header Content-Type harus diatur SEBELUM WriteHeader/Encode.',
        'Bentuk respons gagal selalu <code>{"error": "pesan"}</code> → klien tahu cara membacanya.',
        'Delete membalas 204 tanpa body — lebih hemat dan sesuai konvensi REST.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Validasi Input</h3><p>Klien bisa mengirim apa saja, jadi <b>jangan percaya</b> data masuk. Validasi ditempatkan di model agar bisa dipakai ulang untuk create dan update.</p>'
    },
    {
      type: 'example',
      title: 'Validasi yang mengumpulkan semua masalah',
      lang: 'go',
      output: false,
      code: `func (in ProductInput) Validate() error {
    var errs []string

    if name := strings.TrimSpace(in.Name); len(name) < 3 || len(name) > 100 {
        errs = append(errs, "nama harus 3–100 karakter")
    }
    if in.Price < 0 {
        errs = append(errs, "harga tidak boleh negatif")
    }
    if in.Stock < 0 {
        errs = append(errs, "stok tidak boleh negatif")
    }

    if len(errs) > 0 {
        return errors.New(strings.Join(errs, "; "))
    }
    return nil
}`,
      explain: [
        'Semua masalah dikumpulkan dulu → klien tahu semua yang harus diperbaiki sekaligus.',
        'Hasilnya dijadikan pesan 400 Bad Request yang informatif.',
        'TrimSpace membersihkan spasi berlebih sebelum memeriksa panjang.'
      ]
    },
    {
      type: 'example',
      title: 'Memetakan error service → status HTTP',
      lang: 'go',
      output: false,
      code: `func mapServiceError(w http.ResponseWriter, err error) {
    switch {
    case errors.Is(err, service.ErrValidation):
        writeError(w, http.StatusBadRequest, err.Error())     // 400
    case errors.Is(err, service.ErrUnauthorized):
        writeError(w, http.StatusUnauthorized, err.Error())   // 401
    case errors.Is(err, service.ErrForbidden):
        writeError(w, http.StatusForbidden, err.Error())       // 403
    case errors.Is(err, service.ErrConflict):
        writeError(w, http.StatusConflict, err.Error())        // 409
    case errors.Is(err, service.ErrNotFound):
        writeError(w, http.StatusNotFound, err.Error())        // 404
    default:
        writeError(w, http.StatusInternalServerError,
            "kesalahan server") // 500 — jangan bocorkan detail internal
    }
}`,
      explain: [
        'Satu titik pemetaan → status code konsisten di seluruh API.',
        'Error tak dikenal (mis. gangguan database) jadi 500 tanpa membocorkan detail internal ke klien.',
        'Pola <code>errors.Is</code> bekerja walau error sudah dibungkus <code>fmt.Errorf("%w")</code>.'
      ]
    },
    {
      type: 'tip',
      title: 'Pagination di dua sisi',
      text: 'Handler meneruskan page/limit apa adanya, service yang memberi default & batas (limit maksimal 100). Pisah tanggung jawab ini agar handler tetap tipis dan aturan bisnis terpusat di service.'
    },
    {
      type: 'warn',
      title: 'Jangan tampilkan detail error internal',
      text: 'Pesan error 500 sebaiknya generik ("kesalahan server") dan detailnya dicatat ke log di sisi server. Menampilkan pesan mentah database ke klien bisa membocorkan struktur skema dan membantu penyerang.'
    },
    {
      type: 'vocab',
      items: [
        ['ServeMux', 'Router bawaan net/http; sejak Go 1.22 mendukung method + path pattern.'],
        ['PathValue', 'r.PathValue("id") membaca nilai path parameter {id}.'],
        ['Decode / Encode', 'json.NewDecoder().Decode() membaca body; Encoder menulis respons.'],
        ['Status code', 'Angka HTTP (200/201/400/401/403/404/500) yang menjelaskan hasil request.'],
        ['Pagination', 'Memecah data menjadi halaman lewat parameter page & limit.']
      ]
    }
  ],
  recap: [
    'ServeMux Go 1.22+ mendukung "METHOD /path/{param}" dan memberi 405/404 otomatis.',
    'PathValue untuk path param, r.URL.Query() untuk query string — keduanya wajib divalidasi.',
    'Body di-decode dengan json.Decoder, respons ditulis dengan Encoder + Content-Type JSON.',
    'Validasi menimbun semua error sekaligus agar klien tahu semua perbaikan yang dibutuhkan.',
    'Error service dipetakan ke status HTTP di satu titik; error tak dikenal → 500 generik.'
  ]
});
