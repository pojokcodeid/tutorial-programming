/* ============================================================
   Unit testing lapisan HTTP (handler + router + middleware)
   dengan httptest — TANPA database & TANPA server sungguhan.
   Service di-mock, lalu request dilewatkan lewat router asli,
   sehingga jalur middleware (JWT, role) ikut teruji.
   ============================================================ */
package router

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"example.com/go-restapi/internal/model"
	"example.com/go-restapi/internal/service"
)

/* ---------- mock service ---------- */

type mockAuthService struct {
	validTokens map[string]*service.Claims // token → klaim
}

func (m *mockAuthService) Register(ctx context.Context, in service.RegisterInput) (*model.User, error) {
	return &model.User{ID: 1, Username: in.Username, Email: in.Email, Role: model.RoleUser}, nil
}

func (m *mockAuthService) Login(ctx context.Context, in service.LoginInput) (string, *model.User, error) {
	return "token-umum", &model.User{ID: 1, Username: in.Username, Role: model.RoleUser}, nil
}

func (m *mockAuthService) ParseToken(ctx context.Context, raw string) (*service.Claims, error) {
	if claims, ok := m.validTokens[raw]; ok {
		return claims, nil
	}
	return nil, service.ErrUnauthorized
}

type mockProductService struct {
	items []model.Product
}

func (m *mockProductService) List(ctx context.Context, page, limit int) (*service.PageResult, error) {
	return &service.PageResult{Items: m.items, Total: int64(len(m.items)), Page: 1, Limit: 20}, nil
}
func (m *mockProductService) Get(ctx context.Context, id int64) (*model.Product, error) {
	for _, p := range m.items {
		if p.ID == id {
			return &p, nil
		}
	}
	return nil, service.ErrNotFound
}
func (m *mockProductService) Create(ctx context.Context, creatorID int64, in model.ProductInput) (*model.Product, error) {
	return &model.Product{ID: 99, Name: in.Name, Price: in.Price, Stock: in.Stock, CreatedBy: creatorID}, nil
}
func (m *mockProductService) Update(ctx context.Context, id int64, in model.ProductInput) (*model.Product, error) {
	return &model.Product{ID: id, Name: in.Name, Price: in.Price, Stock: in.Stock}, nil
}
func (m *mockProductService) Delete(ctx context.Context, id int64) error { return nil }

/* ---------- helper ---------- */

const (
	tokenUser  = "token-user"  // klaim peran user
	tokenAdmin = "token-admin" // klaim peran admin
)

func newTestServer() http.Handler {
	auth := &mockAuthService{
		validTokens: map[string]*service.Claims{
			tokenUser:  {UserID: 1, Role: model.RoleUser},
			tokenAdmin: {UserID: 2, Role: model.RoleAdmin},
		},
	}
	prod := &mockProductService{
		items: []model.Product{{ID: 1, Name: "Laptop", Price: 9_500_000, Stock: 4}},
	}
	return New(auth, prod)
}

// doRequest menjalankan request palsu lewat router dan mengembalikan recorder.
func do(t *testing.T, handler http.Handler, method, path, body, bearer string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	if bearer != "" {
		req.Header.Set("Authorization", "Bearer "+bearer)
	}
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	return rec
}

/* ---------- pengujian ---------- */

func TestGET_Products_Publik(t *testing.T) {
	srv := newTestServer()
	rec := do(t, srv, http.MethodGet, "/api/v1/products", "", "")

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	var res service.PageResult
	if err := json.Unmarshal(rec.Body.Bytes(), &res); err != nil {
		t.Fatalf("body bukan JSON sah: %v", err)
	}
	if len(res.Items) != 1 || res.Items[0].Name != "Laptop" {
		t.Errorf("isi body = %+v", res)
	}
}

func TestGET_ProductByID_TidakAda(t *testing.T) {
	srv := newTestServer()
	rec := do(t, srv, http.MethodGet, "/api/v1/products/12345", "", "")

	if rec.Code != http.StatusNotFound {
		t.Errorf("status = %d, want 404", rec.Code)
	}
}

func TestPOST_Products_TanpaToken_401(t *testing.T) {
	srv := newTestServer()
	body := `{"name":"Baru","price":1000,"stock":1}`
	rec := do(t, srv, http.MethodPost, "/api/v1/products", body, "")

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", rec.Code)
	}
}

func TestPOST_Products_TokenPalsu_401(t *testing.T) {
	srv := newTestServer()
	body := `{"name":"Baru","price":1000,"stock":1}`
	rec := do(t, srv, http.MethodPost, "/api/v1/products", body, "token-penyerang")

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", rec.Code)
	}
}

func TestPOST_Products_PeranUser_403(t *testing.T) {
	srv := newTestServer()
	body := `{"name":"Baru","price":1000,"stock":1}`
	rec := do(t, srv, http.MethodPost, "/api/v1/products", body, tokenUser)

	if rec.Code != http.StatusForbidden {
		t.Errorf("status = %d, want 403 (peran user tidak boleh create)", rec.Code)
	}
}

func TestPOST_Products_PeranAdmin_201(t *testing.T) {
	srv := newTestServer()
	body := `{"name":"Laptop Baru","price":1000000,"stock":2}`
	rec := do(t, srv, http.MethodPost, "/api/v1/products", body, tokenAdmin)

	if rec.Code != http.StatusCreated {
		t.Fatalf("status = %d, want 201", rec.Code)
	}
	var p model.Product
	if err := json.Unmarshal(rec.Body.Bytes(), &p); err != nil {
		t.Fatalf("body bukan JSON sah: %v", err)
	}
	if p.ID != 99 || p.Name != "Laptop Baru" {
		t.Errorf("isi body = %+v", p)
	}
}

func TestPOST_Products_BodyRusak_400(t *testing.T) {
	srv := newTestServer()
	rec := do(t, srv, http.MethodPost, "/api/v1/products", `{"name":`, tokenAdmin)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", rec.Code)
	}
}

func TestDELETE_Products_PeranAdmin_204(t *testing.T) {
	srv := newTestServer()
	rec := do(t, srv, http.MethodDelete, "/api/v1/products/1", "", tokenAdmin)

	if rec.Code != http.StatusNoContent {
		t.Errorf("status = %d, want 204", rec.Code)
	}
}

func TestAuthMe_DenganToken_200(t *testing.T) {
	srv := newTestServer()
	rec := do(t, srv, http.MethodGet, "/api/v1/auth/me", "", tokenUser)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	var res map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &res); err != nil {
		t.Fatal(err)
	}
	if res["role"] != model.RoleUser {
		t.Errorf("role = %v, want user", res["role"])
	}
}

/* ---------- contoh JWT asli (tanpa mock) di lapisan token ---------- */

// TestJWTAsli_MetodeHS256 memastikan library jwt bekerja seperti
// yang dijelaskan: tanda tangan HS256 + verifikasi dengan secret.
func TestJWTAsli_MetodeHS256(t *testing.T) {
	secret := []byte("rahasia")
	claims := &service.Claims{
		UserID: 7,
		Role:   model.RoleAdmin,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
		},
	}
	tokenStr, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(secret)
	if err != nil {
		t.Fatal(err)
	}

	parsed := &service.Claims{}
	_, err = jwt.ParseWithClaims(tokenStr, parsed, func(tok *jwt.Token) (any, error) {
		return secret, nil
	})
	if err != nil {
		t.Fatalf("token gagal diverifikasi: %v", err)
	}
	if parsed.UserID != 7 || parsed.Role != model.RoleAdmin {
		t.Errorf("klaim = %+v", parsed)
	}
}
