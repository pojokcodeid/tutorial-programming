/*
Package httpapi — API baca/tandai notifikasi untuk frontend.
*/
package httpapi

import (
	"database/sql"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strconv"

	"example.com/tokokita/internal/logx"
	"example.com/tokokita/services/notification/internal/store"
)

type API struct {
	store *store.Store
	log   *slog.Logger
}

func New(s *store.Store, log *slog.Logger) *API { return &API{store: s, log: log} }

// Router memakai pola method + path net/http Go 1.22+; /healthz tidak
// dicatat agar log tidak dibanjiri baris healthcheck compose.
func (a *API) Router() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	mux.HandleFunc("GET /notifications", a.list)
	mux.HandleFunc("PATCH /notifications/{id}/read", a.markRead)
	return logx.Middleware(a.log, "/healthz")(mux)
}

func (a *API) list(w http.ResponseWriter, r *http.Request) {
	list, err := a.store.List(r.Context())
	if err != nil {
		a.log.Error("gagal membaca daftar notifikasi", "galat", err)
		writeError(w, http.StatusInternalServerError, "gagal membaca notifikasi")
		return
	}
	if list == nil {
		list = []store.Notification{}
	}
	unread, err := a.store.UnreadCount(r.Context())
	if err != nil {
		// Bukan kegagalan fatal: daftar tetap dikirim, hanya angka badge
		// lonceng yang awalnya 0. Tetap dicatat agar tidak diam-diam.
		a.log.Warn("gagal membaca jumlah notifikasi belum dibaca", "galat", err)
		unread = 0
	}
	w.Header().Set("X-Unread-Count", strconv.Itoa(unread))
	writeJSON(w, http.StatusOK, list)
}

func (a *API) markRead(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "id tidak valid")
		return
	}
	if err := a.store.MarkRead(r.Context(), id); errors.Is(err, sql.ErrNoRows) {
		writeError(w, http.StatusNotFound, "notifikasi tidak ditemukan")
		return
	} else if err != nil {
		a.log.Error("gagal menandai notifikasi dibaca", "notifikasi_id", id, "galat", err)
		writeError(w, http.StatusInternalServerError, "gagal menandai notifikasi")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"message": msg})
}
