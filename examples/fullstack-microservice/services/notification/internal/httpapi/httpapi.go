/*
Package httpapi — API baca/tandai notifikasi untuk frontend.
*/
package httpapi

import (
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
	"time"

	"example.com/tokokita/services/notification/internal/store"
)

type API struct{ store *store.Store }

func New(s *store.Store) *API { return &API{store: s} }

func (a *API) Router() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	mux.HandleFunc("GET /notifications", a.list)
	mux.HandleFunc("PATCH /notifications/{id}/read", a.markRead)
	return logRequests(mux)
}

func (a *API) list(w http.ResponseWriter, r *http.Request) {
	list, err := a.store.List(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "gagal membaca notifikasi")
		return
	}
	if list == nil {
		list = []store.Notification{}
	}
	unread, _ := a.store.UnreadCount(r.Context())
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

func logRequests(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s (%s)", r.Method, r.URL.Path, time.Since(start).Round(time.Millisecond))
	})
}
