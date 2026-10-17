/*
============================================================

	Package middleware — penyangga (middleware) HTTP:
	- Logging: mencatat setiap request yang masuk
	- Authenticate: memverifikasi JWT dari header Authorization
	- RequireRole: membatasi akses berdasarkan peran (admin/user)
	============================================================
*/
package middleware

import (
	"context"
	"log"
	"net/http"
	"strings"
	"time"

	"example.com/go-restapi/internal/service"
)

// contextKey tipe khusus agar aman menyimpan values di context.
type contextKey string

const claimsKey contextKey = "claims"

// TokenValidator dipenuhi oleh service.AuthService.
type TokenValidator interface {
	ParseToken(ctx context.Context, raw string) (*service.Claims, error)
}

// Logging mencatat method, path, status, dan durasi tiap request.
func Logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Bungkus ResponseWriter agar status code bisa "dipantau".
		rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(rec, r)

		log.Printf("%s %s -> %d (%s)", r.Method, r.URL.Path, rec.status, time.Since(start).Round(time.Millisecond))
	})
}

// statusRecorder mengingat status code yang ditulis handler.
type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (r *statusRecorder) WriteHeader(code int) {
	r.status = code
	r.ResponseWriter.WriteHeader(code)
}

// Authenticate memverifikasi Bearer token JWT. Jika valid, klaim
// disimpan ke context agar handler tidak perlu membaca header lagi.
func Authenticate(v TokenValidator) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			if !strings.HasPrefix(header, "Bearer ") {
				writeJSON(w, http.StatusUnauthorized, "token tidak diberikan")
				return
			}
			raw := strings.TrimSpace(strings.TrimPrefix(header, "Bearer "))

			claims, err := v.ParseToken(r.Context(), raw)
			if err != nil {
				writeJSON(w, http.StatusUnauthorized, "token tidak valid")
				return
			}

			// Simpan klaim ke context request.
			ctx := context.WithValue(r.Context(), claimsKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireRole hanya meneruskan request dengan peran tertentu.
func RequireRole(role string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims := ClaimsFromContext(r.Context())
			if claims == nil || claims.Role != role {
				writeJSON(w, http.StatusForbidden, "akses ditolak: peran tidak mencukupi")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// ClaimsFromContext mengambil klaim yang sudah divalidasi Authenticate.
func ClaimsFromContext(ctx context.Context) *service.Claims {
	claims, _ := ctx.Value(claimsKey).(*service.Claims)
	return claims
}

func writeJSON(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	w.Write([]byte(`{"error":"` + message + `"}`))
}
