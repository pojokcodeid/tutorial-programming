/*
============================================================

	Package router — merangkai seluruh route API.
	Go 1.22+ ServeMux mendukung pola method + path:
	"GET /api/v1/products/{id}" → {id} bisa dibaca r.PathValue("id").
	============================================================
*/
package router

import (
	"net/http"

	"example.com/go-restapi/internal/handler"
	"example.com/go-restapi/internal/middleware"
	"example.com/go-restapi/internal/model"
	"example.com/go-restapi/internal/service"
)

// New membangun http.Handler lengkap dengan seluruh route & middleware.
func New(auth service.AuthService, products service.ProductService) http.Handler {
	authH := handler.NewAuthHandler(auth)
	prodH := handler.NewProductHandler(products)

	mux := http.NewServeMux()

	// --- Route publik (tanpa token) ---
	mux.HandleFunc("POST /api/v1/auth/register", authH.Register)
	mux.HandleFunc("POST /api/v1/auth/login", authH.Login)
	mux.HandleFunc("GET /api/v1/products", prodH.List)
	mux.HandleFunc("GET /api/v1/products/{id}", prodH.Get)

	// --- Route yang butuh token valid ---
	authMw := middleware.Authenticate(auth)
	mux.Handle("GET /api/v1/auth/me", authMw(http.HandlerFunc(authH.Me)))

	// --- Route khusus admin (token valid + peran admin) ---
	// Urutan: Authenticate dulu (verifikasi token), lalu RequireRole
	// (cek peran), baru handler yang dijalankan.
	adminOnly := func(h http.Handler) http.Handler {
		return authMw(middleware.RequireRole(model.RoleAdmin)(h))
	}
	mux.Handle("POST /api/v1/products", adminOnly(http.HandlerFunc(prodH.Create)))
	mux.Handle("PUT /api/v1/products/{id}", adminOnly(http.HandlerFunc(prodH.Update)))
	mux.Handle("DELETE /api/v1/products/{id}", adminOnly(http.HandlerFunc(prodH.Delete)))

	// Bungkus semua route dengan logging.
	return middleware.Logging(mux)
}
