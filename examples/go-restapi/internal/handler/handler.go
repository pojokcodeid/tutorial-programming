/*
============================================================

	Package handler — lapisan HTTP: decode request, panggil
	service, encode response JSON + status code yang tepat.
	============================================================
*/
package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"example.com/go-restapi/internal/middleware"
	"example.com/go-restapi/internal/model"
	"example.com/go-restapi/internal/service"
)

// AuthHandler menangani endpoint autentikasi.
type AuthHandler struct {
	auth service.AuthService
}

// NewAuthHandler membuat AuthHandler dengan dependensi AuthService.
func NewAuthHandler(auth service.AuthService) *AuthHandler {
	return &AuthHandler{auth: auth}
}

// Register menangani POST /api/v1/auth/register
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var in service.RegisterInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, "body JSON tidak valid: "+err.Error())
		return
	}

	user, err := h.auth.Register(r.Context(), in)
	if err != nil {
		mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, user)
}

// Login menangani POST /api/v1/auth/login
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var in service.LoginInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, "body JSON tidak valid: "+err.Error())
		return
	}

	token, user, err := h.auth.Login(r.Context(), in)
	if err != nil {
		mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"token": token, "user": user})
}

// Me menangani GET /api/v1/auth/me (butuh token valid).
func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	if claims == nil {
		writeError(w, http.StatusUnauthorized, "belum login")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"user_id": claims.UserID,
		"role":    claims.Role,
	})
}

// ProductHandler menangani endpoint produk.
type ProductHandler struct {
	products service.ProductService
}

// NewProductHandler membuat ProductHandler dengan dependensi ProductService.
func NewProductHandler(products service.ProductService) *ProductHandler {
	return &ProductHandler{products: products}
}

// List menangani GET /api/v1/products?page=1&limit=20
func (h *ProductHandler) List(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))   // default 0 → disetel service
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit")) // default 0 → disetel service

	result, err := h.products.List(r.Context(), page, limit)
	if err != nil {
		mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

// Get menangani GET /api/v1/products/{id}
func (h *ProductHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "id tidak valid")
		return
	}

	product, err := h.products.Get(r.Context(), id)
	if err != nil {
		mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, product)
}

// Create menangani POST /api/v1/products (butuh peran admin).
func (h *ProductHandler) Create(w http.ResponseWriter, r *http.Request) {
	var in model.ProductInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, "body JSON tidak valid: "+err.Error())
		return
	}

	claims := middleware.ClaimsFromContext(r.Context())
	product, err := h.products.Create(r.Context(), claims.UserID, in)
	if err != nil {
		mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, product)
}

// Update menangani PUT /api/v1/products/{id} (butuh peran admin).
func (h *ProductHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "id tidak valid")
		return
	}

	var in model.ProductInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, "body JSON tidak valid: "+err.Error())
		return
	}

	product, err := h.products.Update(r.Context(), id, in)
	if err != nil {
		mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, product)
}

// Delete menangani DELETE /api/v1/products/{id} (butuh peran admin).
func (h *ProductHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "id tidak valid")
		return
	}

	if err := h.products.Delete(r.Context(), id); err != nil {
		mapServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent) // 20204: sukses tanpa body
}

/* ---------- helper response ---------- */

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

// mapServiceError memetakan error service ke status HTTP.
func mapServiceError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, service.ErrValidation):
		writeError(w, http.StatusBadRequest, err.Error())
	case errors.Is(err, service.ErrUnauthorized):
		writeError(w, http.StatusUnauthorized, err.Error())
	case errors.Is(err, service.ErrForbidden):
		writeError(w, http.StatusForbidden, err.Error())
	case errors.Is(err, service.ErrConflict):
		writeError(w, http.StatusConflict, err.Error())
	case errors.Is(err, service.ErrNotFound):
		writeError(w, http.StatusNotFound, err.Error())
	default:
		// Error tak terduga (mis. gangguan database) → 500
		writeError(w, http.StatusInternalServerError, "kesalahan server")
	}
}
