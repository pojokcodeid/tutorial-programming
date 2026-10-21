/*
Package httpapi — lapisan HTTP product-service.

Mengubah permintaan JSON menjadi panggilan store/cache dan
mengubah hasilnya kembali menjadi JSON dengan kode status yang tepat.
*/
package httpapi

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

	"example.com/tokokita/internal/logx"
	"example.com/tokokita/services/product/internal/cache"
	"example.com/tokokita/services/product/internal/store"
)

type API struct {
	store    *store.Store
	cache    *cache.Cache
	cacheTTL time.Duration
	log      *slog.Logger
}

func New(s *store.Store, c *cache.Cache, ttl time.Duration, log *slog.Logger) *API {
	return &API{store: s, cache: c, cacheTTL: ttl, log: log}
}

// Router memakai pola method + path dari net/http Go 1.22+ —
// tanpa framework routing tambahan. /healthz tidak dicatat (healthcheck
// berjalan tiap beberapa detik dan hanya menambah baris mati di log).
func (a *API) Router() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", a.healthz)
	mux.HandleFunc("GET /products", a.list)
	mux.HandleFunc("POST /products", a.create)
	mux.HandleFunc("GET /products/{id}", a.get)
	mux.HandleFunc("PUT /products/{id}", a.update)
	mux.HandleFunc("DELETE /products/{id}", a.delete)
	return logx.Middleware(a.log, "/healthz")(mux)
}

func (a *API) healthz(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// list menampilkan semua produk; inilah yang paling sering diminta frontend
// dan paling diuntungkan oleh cache Redis.
func (a *API) list(w http.ResponseWriter, r *http.Request) {
	if list, ok := a.cache.GetDaftar(r.Context()); ok {
		w.Header().Set("X-Cache", "HIT") // bukti nyata cache bekerja
		writeJSON(w, http.StatusOK, list)
		return
	}
	list, err := a.store.List(r.Context())
	if err != nil {
		// Galat database dicatat BERSAMA pesan untuk klien: klien hanya
		// melihat "gagal membaca produk", penyebab sebenarnya ada di log.
		a.log.Error("gagal membaca daftar produk", "galat", err)
		writeError(w, http.StatusInternalServerError, "gagal membaca produk")
		return
	}
	if list == nil {
		list = []store.Product{} // JSON [] bukan null
	}
	a.cache.SetDaftar(r.Context(), list, a.cacheTTL)
	w.Header().Set("X-Cache", "MISS")
	writeJSON(w, http.StatusOK, list)
}

func (a *API) get(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "id tidak valid")
		return
	}
	if p, ok := a.cache.GetProduk(r.Context(), id); ok {
		w.Header().Set("X-Cache", "HIT")
		writeJSON(w, http.StatusOK, p)
		return
	}
	p, err := a.store.Get(r.Context(), id)
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "produk tidak ditemukan")
		return
	}
	if err != nil {
		a.log.Error("gagal membaca produk", "produk_id", id, "galat", err)
		writeError(w, http.StatusInternalServerError, "gagal membaca produk")
		return
	}
	a.cache.SetProduk(r.Context(), p, a.cacheTTL)
	w.Header().Set("X-Cache", "MISS")
	writeJSON(w, http.StatusOK, p)
}

func (a *API) create(w http.ResponseWriter, r *http.Request) {
	var p store.Product
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		writeError(w, http.StatusBadRequest, "body JSON tidak valid")
		return
	}
	if msg := validasi(p); msg != "" {
		writeError(w, http.StatusUnprocessableEntity, msg)
		return
	}
	id, err := a.store.Create(r.Context(), p)
	if err != nil {
		a.log.Error("gagal menyimpan produk", "galat", err)
		writeError(w, http.StatusInternalServerError, "gagal menyimpan produk")
		return
	}
	p.ID = id
	a.cache.Invalidate(r.Context(), id) // buang cache basi
	a.log.Info("cache diinvalidasi", "kunci", "product:"+strconv.FormatInt(id, 10), "produk_id", id)
	writeJSON(w, http.StatusCreated, p)
}

func (a *API) update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "id tidak valid")
		return
	}
	var p store.Product
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		writeError(w, http.StatusBadRequest, "body JSON tidak valid")
		return
	}
	p.ID = id
	if msg := validasi(p); msg != "" {
		writeError(w, http.StatusUnprocessableEntity, msg)
		return
	}
	if err := a.store.Update(r.Context(), p); errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "produk tidak ditemukan")
		return
	} else if err != nil {
		a.log.Error("gagal mengubah produk", "produk_id", id, "galat", err)
		writeError(w, http.StatusInternalServerError, "gagal mengubah produk")
		return
	}
	a.cache.Invalidate(r.Context(), id)
	a.log.Info("cache diinvalidasi", "kunci", "product:"+strconv.FormatInt(id, 10), "produk_id", id, "aksi", "ubah")
	writeJSON(w, http.StatusOK, p)
}

func (a *API) delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "id tidak valid")
		return
	}
	if err := a.store.Delete(r.Context(), id); errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "produk tidak ditemukan")
		return
	} else if err != nil {
		a.log.Error("gagal menghapus produk", "produk_id", id, "galat", err)
		writeError(w, http.StatusInternalServerError, "gagal menghapus produk")
		return
	}
	a.cache.Invalidate(r.Context(), id)
	a.log.Info("cache diinvalidasi", "kunci", "product:"+strconv.FormatInt(id, 10), "produk_id", id, "aksi", "hapus")
	w.WriteHeader(http.StatusNoContent)
}

// validasi mengembalikan pesan galat pertama yang ditemukan ("" = sah).
func validasi(p store.Product) string {
	if strings.TrimSpace(p.Name) == "" {
		return "nama produk wajib diisi"
	}
	if p.Price < 0 {
		return "harga tidak boleh negatif"
	}
	if p.Stock < 0 {
		return "stok tidak boleh negatif"
	}
	return ""
}

/* ---------- pembungkus JSON ---------- */

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"message": msg})
}
