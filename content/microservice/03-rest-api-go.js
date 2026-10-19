/* ============================================================
   Pelajaran Microservices — Bab 3: REST API dengan net/http
   ============================================================ */
'use strict';

window.MICROSERVICE_LESSONS = window.MICROSERVICE_LESSONS || [];

window.MICROSERVICE_LESSONS.push({
  id: 'rest-api-go',
  title: 'Membangun REST API dengan net/http dan ServeMux Go 1.22',
  chapter: 'Membangun Service',
  duration: '15–17 menit',
  intro: [
    'Sampai di sini fondasinya siap, saatnya menulis service sungguhan. Kita akan membangun <code>catalog-service</code> pada port 8081 dengan enam endpoint: <code>/healthz</code> dan CRUD produk lengkap (GET, POST, PUT, DELETE) — data masih disimpan di memori supaya fokus kita murni pada lapisan HTTP. Kejutan menyenangkan sejak Go 1.22: standar library <code>net/http</code> kini punya router yang cukup, sehingga framework pihak ketiga benar-benar tidak wajib untuk service seukuran ini. Bab ini juga menyiapkan kebiasaan yang terbawa sampai produksi: format error JSON konsisten, middleware logging dan request ID, structured logging dengan <code>log/slog</code>, server timeouts, health check, graceful shutdown, serta gambaran dokumentasi OpenAPI.'
  ],
  objectives: [
    'Memakai http.ServeMux Go 1.22 dengan pola rute method + path dan wildcard {id}',
    'Menulis handler yang decode input, memvalidasi, lalu encode JSON dengan status tepat',
    'Menyusun middleware logging, request ID, dan recovery secara berlapis dengan log/slog',
    'Mengonfigurasi server timeouts dan graceful shutdown, lalu mengujinya dengan curl'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>ServeMux 1.22, Handler, dan Format Error</h3><p>Sejak Go 1.22, <code>http.ServeMux</code> memahami pola rute berbentuk <code>METHOD /path</code>: method yang salah otomatis dijawab <code>405 Method Not Allowed</code>, <code>{id}</code> menangkap satu segmen path yang dibaca dengan <code>r.PathValue("id")</code>, dan ketika dua pola cocok yang <b>lebih spesifik menang</b>.</p><p>Handler adalah fungsi <code>func(w http.ResponseWriter, r *http.Request)</code>. Dua kebiasaan yang membuat API terasa profesional: <b>selalu</b> set header <code>Content-Type: application/json</code> sebelum menulis body, dan pakai bentuk error yang sama di seluruh endpoint — <code>{"error": "code", "message": "teks manusiawi"}</code>, dengan tambahan <code>"fields"</code> bila gagalnya di validasi. Klien seperti order-service cukup memeriksa field <code>error</code> sebagai kode program dan <code>message</code> untuk ditampilkan.</p>'
    },
    {
      type: 'text',
      html: '<h3>Middleware, Logging, Shutdown, dan Health Check</h3><p><b>Middleware</b> adalah pembungkus handler yang menambahkan perilaku umum: <b>request ID</b> memberi identitas unik agar request bisa dicari di log lintas service, <b>logging</b> mencatat method, path, dan durasi (status pun bisa dibaca dengan membungkus ResponseWriter pada tipe kecil), <b>recovery</b> menangkap panic agar satu handler rusak tidak mematikan seluruh proses. Log dicatat dengan <code>log/slog</code> berbentuk JSON sehingga siap dicari mesin.</p><p>Di akhir <code>main</code>, server diberi empat timeout (<code>ReadHeaderTimeout</code>, <code>ReadTimeout</code>, <code>WriteTimeout</code>, <code>IdleTimeout</code>) lalu mendengarkan sinyal SIGTERM; <code>srv.Shutdown</code> berhenti menerima koneksi baru tetapi memberi waktu bagi request yang sedang berjalan — inilah <b>graceful shutdown</b> yang membuat rolling update tanpa error 502. <code>/healthz</code> wajib ada sebagai penanda <b>liveness</b>; setelah database terpasang di Bab 4, pisahkan juga <code>/readyz</code> untuk <b>readiness</b> (dependensi siap menerima trafik). Setiap endpoint berikutnya sebaiknya didokumentasikan dalam <b>OpenAPI</b> — spesifikasi JSON atau YAML berisi path, method, skema request dan respons, serta kode error — yang kelak bisa diuji kesesuaiannya terhadap kode (<i>contract testing</i>).</p>'
    },
    {
      type: 'example',
      title: 'Contoh: catalog-service Utuh dalam Satu Berkas main.go',
      lang: 'go',
      output: false,
      code: `package main

import (
    "context"
    "encoding/json"
    "errors"
    "log/slog"
    "net/http"
    "os"
    "os/signal"
    "strconv"
    "sync"
    "syscall"
    "time"
)

type Product struct {
    ID    string \`json:"id"\`
    Name  string \`json:"name"\`
    Price int64  \`json:"price"\` // rupiah bulat
    Stock int    \`json:"stock"\`
}
type createProductInput struct {
    Name  string \`json:"name"\`
    Price int64  \`json:"price"\`
    Stock int    \`json:"stock"\`
}
func (in createProductInput) validate() map[string]string {
    errs := map[string]string{}
    if in.Name == "" { errs["name"] = "wajib diisi" }
    if in.Price <= 0 { errs["price"] = "harus lebih besar dari 0" }
    if in.Stock < 0 { errs["stock"] = "tidak boleh negatif" }
    return errs
}
type productStore struct {
    mu     sync.RWMutex // melindungi peta dari akses bersamaan
    nextID int
    items  map[string]Product
}
func newProductStore() *productStore { return &productStore{items: make(map[string]Product)} }
func (s *productStore) get(id string) (Product, bool) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    p, ok := s.items[id]
    return p, ok
}
func (s *productStore) create(in createProductInput) Product {
    s.mu.Lock()
    defer s.mu.Unlock()
    s.nextID++
    p := Product{ID: strconv.Itoa(s.nextID), Name: in.Name, Price: in.Price, Stock: in.Stock}
    s.items[p.ID] = p
    return p
}
type handler struct{ store *productStore }

func writeJSON(w http.ResponseWriter, status int, v any) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(v)
}
func writeError(w http.ResponseWriter, status int, code, msg string) {
    writeJSON(w, status, map[string]string{"error": code, "message": msg})
}
func (h *handler) decode(w http.ResponseWriter, r *http.Request) (createProductInput, bool) {
    var in createProductInput
    if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&in); err != nil {
        writeError(w, http.StatusBadRequest, "invalid_json", "body bukan JSON yang valid")
        return in, false
    }
    if errs := in.validate(); len(errs) > 0 {
        writeJSON(w, http.StatusUnprocessableEntity, map[string]any{
            "error": "validation_failed", "message": "input tidak lolos validasi", "fields": errs})
        return in, false
    }
    return in, true
}
// GET /healthz menandai proses hidup; /readyz menyusul di Bab 4 saat database terpasang
func (h *handler) healthz(w http.ResponseWriter, _ *http.Request) { writeJSON(w, http.StatusOK, map[string]string{"status": "ok"}) }
func (h *handler) listProducts(w http.ResponseWriter, _ *http.Request) { writeJSON(w, http.StatusOK, map[string]any{"data": h.store.list()}) }
func (h *handler) getProduct(w http.ResponseWriter, r *http.Request) {
    p, ok := h.store.get(r.PathValue("id"))
    if !ok {
        writeError(w, http.StatusNotFound, "not_found", "produk tidak ditemukan")
        return
    }
    writeJSON(w, http.StatusOK, p)
}
func (h *handler) createProduct(w http.ResponseWriter, r *http.Request) {
    in, ok := h.decode(w, r)
    if !ok { return }
    p := h.store.create(in)
    w.Header().Set("Location", "/products/"+p.ID) // klien tahu di mana sumber baru berada
    writeJSON(w, http.StatusCreated, p)
}
func (h *handler) updateProduct(w http.ResponseWriter, r *http.Request) {
    in, ok := h.decode(w, r)
    if !ok { return }
    p, ok := h.store.update(r.PathValue("id"), in)
    if !ok {
        writeError(w, http.StatusNotFound, "not_found", "produk tidak ditemukan")
        return
    }
    writeJSON(w, http.StatusOK, p)
}
func (h *handler) deleteProduct(w http.ResponseWriter, r *http.Request) {
    if !h.store.delete(r.PathValue("id")) {
        writeError(w, http.StatusNotFound, "not_found", "produk tidak ditemukan")
        return
    }
    w.WriteHeader(http.StatusNoContent) // sukses hapus tidak butuh body
}
type ctxKey string
const requestIDKey ctxKey = "request_id" // tipe kunci khusus menghindari tabrakan context
func withRequestID(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        id := r.Header.Get("X-Request-Id")
        if id == "" { id = strconv.FormatInt(time.Now().UnixNano(), 16) } // produksi: UUID
        w.Header().Set("X-Request-Id", id) // ikut dikirim kembali ke klien
        next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), requestIDKey, id)))
    })
}
func withLogging(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        next.ServeHTTP(w, r)
        slog.Info("http_request", "request_id", r.Header.Get("X-Request-Id"),
            "method", r.Method, "path", r.URL.Path, "duration_ms", time.Since(start).Milliseconds())
    })
}
func withRecovery(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        defer func() {
            if rec := recover(); rec != nil {
                slog.Error("panic_ditangkap", "path", r.URL.Path, "error", rec)
                writeError(w, http.StatusInternalServerError, "internal", "terjadi kesalahan pada server")
            }
        }()
        next.ServeHTTP(w, r)
    })
}

func main() {
    slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))
    h := &handler{store: newProductStore()}
    mux := http.NewServeMux()
    mux.HandleFunc("GET /healthz", h.healthz)
    mux.HandleFunc("GET /products", h.listProducts)
    mux.HandleFunc("GET /products/{id}", h.getProduct)
    mux.HandleFunc("POST /products", h.createProduct)
    mux.HandleFunc("PUT /products/{id}", h.updateProduct)
    mux.HandleFunc("DELETE /products/{id}", h.deleteProduct)
    srv := &http.Server{
        Addr:              ":8081", // catalog-service
        Handler:           withLogging(withRequestID(withRecovery(mux))),
        ReadHeaderTimeout: 5 * time.Second,
        ReadTimeout:       10 * time.Second,
        WriteTimeout:      20 * time.Second,
        IdleTimeout:       60 * time.Second,
    }
    go func() {
        slog.Info("catalog-service berjalan", "addr", srv.Addr)
        if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
            slog.Error("server berhenti karena error", "error", err)
            os.Exit(1)
        }
    }()
    stop := make(chan os.Signal, 1)
    signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
    <-stop // tunggu sinyal berhenti (Ctrl+C atau docker stop)
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    if err := srv.Shutdown(ctx); err != nil {
        slog.Error("graceful shutdown gagal", "error", err)
        os.Exit(1)
    }
}`,
      explain: [
        'Perhatikan urutan lapisan pada <code>Handler</code>: recovery di paling dalam, lalu request ID, lalu logging — sehingga panic pun tetap terekam lengkap dengan request ID-nya. Endpoint menjawab dengan status bermakna: <code>201</code> plus header <code>Location</code>, <code>204</code> untuk delete sukses, <code>404</code> ketika id tidak dikenal, dan <code>422</code> ketika input lolos parsing tetapi gagal aturan bisnis.',
        'Struktur in-memory sengaja dibuat tipis: ketika Bab 4 menggantinya dengan PostgreSQL, hanya isi metode store yang berubah, handler dan routing tidak tersentuh; metode list, update, dan delete menulis pola serupa dengan get dan create. Perhatikan juga <code>decode</code> membatasi body maksimal 1 MB lewat <code>http.MaxBytesReader</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh: Menguji Endpoint dengan curl',
      lang: 'bash',
      output: false,
      code: `curl -s http://localhost:8081/healthz                       # {"status":"ok"}
curl -s -X POST http://localhost:8081/products -H 'Content-Type: application/json' \\
  -d '{"name":"Kopi Susu Gula Aren","price":24000,"stock":50}'   # 201 + Location
curl -s -i -X POST http://localhost:8081/products -H 'Content-Type: application/json' \\
  -d '{"name":"","price":-1}'                                    # 422 + fields
curl -s -i -X PATCH http://localhost:8081/products/1          # 405 dari ServeMux
curl -s http://localhost:8081/products/999                    # 404 not_found
docker stop -t 15 oms-catalog                                 # uji graceful shutdown`,
      explain: [
        'Perhatikan flag <code>-i</code> pada percobaan gagal: status code dan format error adalah bagian dari kontrak API. Percobaan PATCH membuktikan ServeMux 1.22 menangani method secara otomatis.',
        'Perintah terakhir meniru apa yang dilakukan orkestrator saat memperbarui pod: mengirim sinyal berhenti (bisa juga <code>kill -TERM &lt;pid&gt;</code>) lalu menunggu proses menyelesaikan tanggung jawabnya.'
      ]
    },
    {
      type: 'tip',
      title: 'Latihan Mandiri',
      text: 'Perkuat bab ini dengan empat tugas berurutan. (1) Tambahkan endpoint <code>GET /products/featured</code> dan buktikan ia tidak tertelan oleh <code>GET /products/{id}</code>. (2) Tulis middleware rate limiter sederhana yang menghitung request per IP dan menjawab <code>429</code> saat melebihi batas. (3) Buat <code>decode</code> menolak JSON dengan field tak dikenal memakai <code>DisallowUnknownFields()</code>, lalu uji dengan curl. (4) Tulis draf OpenAPI untuk enam endpoint, lengkap dengan contoh body request dan respons.'
    },
    {
      type: 'vocab',
      items: [
        ['ServeMux', 'Router bawaan Go; sejak 1.22 mendukung pola METHOD /path dan wildcard {id}.'],
        ['Handler', 'Antarmuka func(ResponseWriter, *Request); unit terkecil pemrosesan HTTP di Go.'],
        ['Middleware', 'Fungsi yang membungkus handler untuk menambahkan perilaku umum seperti logging atau auth.'],
        ['Request ID', 'Identitas unik per request, disimpan di header dan context untuk pelacakan lintas service.'],
        ['Graceful shutdown', 'Menghentikan server tanpa memutus request yang sedang berjalan, dengan srv.Shutdown.'],
        ['Health check', 'Endpoint penanda kesehatan: liveness untuk hidup-mati, readiness untuk kesiapan menerima trafik.'],
        ['OpenAPI', 'Spesifikasi standar mendeskripsikan kontrak REST API agar mudah dibaca manusia, mesin, dan alat uji.']
      ]
    }
  ],
  recap: [
    'ServeMux Go 1.22 memahami pola GET /products/{id}; method salah dijawab 405 dan nilai wildcard dibaca dengan r.PathValue.',
    'Handler yang baik: decode input dengan batas ukuran, validasi, lalu encode JSON dengan status code yang bermakna.',
    'Middleware logging, request ID, dan recovery dipasang berlapis; urutannya menentukan cakupan masing-masing.',
    'Server timeouts dan graceful shutdown dengan srv.Shutdown membuat service aman dihentikan tanpa memutus request berjalan.'
  ]
});
