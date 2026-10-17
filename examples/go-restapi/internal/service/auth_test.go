/* ============================================================
   Unit testing AuthService — TANPA database.
   Repository di-mock lewat interface, sehingga test cepat &
   tidak bergantung pada MariaDB.
   ============================================================ */
package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"example.com/go-restapi/internal/model"
	"example.com/go-restapi/internal/repository"
)

/* ---------- mock repository ---------- */

// mockUserRepo adalah implementasi UserRepository palsu di memori.
type mockUserRepo struct {
	users  map[string]*model.User // key: username
	create func(u *model.User) error // bisa dioverride per test
}

func newMockUserRepo() *mockUserRepo {
	return &mockUserRepo{users: map[string]*model.User{}}
}

func (m *mockUserRepo) Create(ctx context.Context, u *model.User) error {
	if m.create != nil {
		return m.create(u)
	}
	if _, exists := m.users[u.Username]; exists {
		return repository.ErrDuplicate
	}
	u.ID = int64(len(m.users) + 1)
	cp := *u
	m.users[u.Username] = &cp
	return nil
}

func (m *mockUserRepo) FindByUsername(ctx context.Context, username string) (*model.User, error) {
	u, ok := m.users[username]
	if !ok {
		return nil, repository.ErrNotFound
	}
	cp := *u
	return &cp, nil
}

func (m *mockUserRepo) FindByID(ctx context.Context, id int64) (*model.User, error) {
	for _, u := range m.users {
		if u.ID == id {
			cp := *u
			return &cp, nil
		}
	}
	return nil, repository.ErrNotFound
}

// helper: buat authService dengan secret & expiry tetap untuk test.
func newTestAuthService(repo repository.UserRepository) AuthService {
	return NewAuthService(repo, "secret-test", time.Hour)
}

/* ---------- Register ---------- */

func TestRegister_Berhasil(t *testing.T) {
	svc := newTestAuthService(newMockUserRepo())

	user, err := svc.Register(context.Background(), RegisterInput{
		Username: "budi",
		Email:    "budi@mail.com",
		Password: "rahasia123",
	})
	if err != nil {
		t.Fatalf("Register() error = %v", err)
	}
	if user.ID == 0 {
		t.Error("ID user belum terisi")
	}
	if user.Role != model.RoleUser {
		t.Errorf("Role = %q, want %q", user.Role, model.RoleUser)
	}
	// Password tersimpan sebagai hash, BUKAN teks asli.
	if user.PasswordHash == "rahasia123" {
		t.Error("password tersimpan mentah, harusnya di-hash")
	}
}

// TestRegister_Invalidasi memakai pola TABLE-DRIVEN TEST:
// satu fungsi, banyak kasus, diulang lewat loop.
func TestRegister_Invalidasi(t *testing.T) {
	tests := []struct {
		name    string
		input   RegisterInput
		wantErr bool
	}{
		{"username terlalu pendek", RegisterInput{"ab", "a@mail.com", "rahasia123"}, true},
		{"email tanpa @", RegisterInput{"budi", "budi.mail.com", "rahasia123"}, true},
		{"password kurang dari 8", RegisterInput{"budi", "budi@mail.com", "pendek"}, true},
		{"semua valid", RegisterInput{"budi", "budi@mail.com", "rahasia123"}, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) { // sub-test per kasus
			svc := newTestAuthService(newMockUserRepo())
			_, err := svc.Register(context.Background(), tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("Register(%+v) error = %v, wantErr = %v", tt.input, err, tt.wantErr)
			}
			// Jika error, pastikan error-nya ErrValidation.
			if tt.wantErr && !errors.Is(err, ErrValidation) {
				t.Errorf("error = %v, want errors.Is(err, ErrValidation)", err)
			}
		})
	}
}

func TestRegister_Duplikat(t *testing.T) {
	svc := newTestAuthService(newMockUserRepo())
	in := RegisterInput{"budi", "budi@mail.com", "rahasia123"}

	if _, err := svc.Register(context.Background(), in); err != nil {
		t.Fatalf("registrasi pertama gagal: %v", err)
	}
	_, err := svc.Register(context.Background(), in)
	if !errors.Is(err, ErrConflict) {
		t.Errorf("registrasi kedua error = %v, want ErrConflict", err)
	}
}

/* ---------- Login & JWT ---------- */

func TestLogin_PasswordSalah(t *testing.T) {
	repo := newMockUserRepo()
	svc := newTestAuthService(repo)

	if _, err := svc.Register(context.Background(), RegisterInput{"budi", "budi@mail.com", "rahasia123"}); err != nil {
		t.Fatal(err)
	}

	_, _, err := svc.Login(context.Background(), LoginInput{"budi", "salah!"})
	if !errors.Is(err, ErrUnauthorized) {
		t.Errorf("Login() error = %v, want ErrUnauthorized", err)
	}
}

func TestLogin_UsernameTidakAda(t *testing.T) {
	svc := newTestAuthService(newMockUserRepo())

	// Pesan error harus SAMA dengan password salah (anti user-enumeration).
	_, _, err := svc.Login(context.Background(), LoginInput{"tidakada", "apapun"})
	if !errors.Is(err, ErrUnauthorized) {
		t.Errorf("Login() error = %v, want ErrUnauthorized", err)
	}
}

func TestLogin_Berhasil_MenghasilkanJWTValid(t *testing.T) {
	repo := newMockUserRepo()
	svc := newTestAuthService(repo)

	reg, _ := svc.Register(context.Background(), RegisterInput{"budi", "budi@mail.com", "rahasia123"})

	token, user, err := svc.Login(context.Background(), LoginInput{"budi", "rahasia123"})
	if err != nil {
		t.Fatalf("Login() error = %v", err)
	}
	if token == "" {
		t.Fatal("token kosong")
	}
	if user.Username != "budi" {
		t.Errorf("Username = %q, want %q", user.Username, "budi")
	}

	// Token yang diterbitkan harus bisa diverifikasi sendiri.
	claims, err := svc.ParseToken(context.Background(), token)
	if err != nil {
		t.Fatalf("ParseToken() error = %v", err)
	}
	if claims.UserID != reg.ID {
		t.Errorf("claims.UserID = %d, want %d", claims.UserID, reg.ID)
	}
	if claims.Role != model.RoleUser {
		t.Errorf("claims.Role = %q, want %q", claims.Role, model.RoleUser)
	}
}

/* ---------- Verifikasi JWT ---------- */

func TestParseToken_Kedaluwarsa(t *testing.T) {
	repo := newMockUserRepo()
	// authService dengan expiry NEGATIF → token langsung kedaluwarsa.
	svc := NewAuthService(repo, "secret-test", -time.Hour)

	if _, err := svc.Register(context.Background(), RegisterInput{"budi", "budi@mail.com", "rahasia123"}); err != nil {
		t.Fatal(err)
	}
	token, _, err := svc.Login(context.Background(), LoginInput{"budi", "rahasia123"})
	if err != nil {
		t.Fatal(err)
	}

	if _, err := svc.ParseToken(context.Background(), token); !errors.Is(err, ErrUnauthorized) {
		t.Errorf("ParseToken(token kedaluwarsa) error = %v, want ErrUnauthorized", err)
	}
}

func TestParseToken_SecretBeda(t *testing.T) {
	repo := newMockUserRepo()
	svc := newTestAuthService(repo)

	if _, err := svc.Register(context.Background(), RegisterInput{"budi", "budi@mail.com", "rahasia123"}); err != nil {
		t.Fatal(err)
	}
	token, _, err := svc.Login(context.Background(), LoginInput{"budi", "rahasia123"})
	if err != nil {
		t.Fatal(err)
	}

	// Pemalsu token: tanda tangan dibuat dengan secret lain.
	forged := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{"user_id": 1})
	forgedStr, _ := forged.SignedString([]byte("secret-penyerang"))
	_ = forgedStr

	// Service dengan secret berbeda harus menolak token asli.
	other := NewAuthService(repo, "secret-lain", time.Hour)
	if _, err := other.ParseToken(context.Background(), token); !errors.Is(err, ErrUnauthorized) {
		t.Errorf("ParseToken(secret salah) error = %v, want ErrUnauthorized", err)
	}
}

func TestParseToken_Sampah(t *testing.T) {
	svc := newTestAuthService(newMockUserRepo())

	if _, err := svc.ParseToken(context.Background(), "bukan.jwt.sah"); !errors.Is(err, ErrUnauthorized) {
		t.Errorf("ParseToken(sampah) error = %v, want ErrUnauthorized", err)
	}
}

/* ---------- bcrypt ---------- */

func TestHashPassword_Bertipe(t *testing.T) {
	hash, err := bcrypt.GenerateFromPassword([]byte("rahasia123"), bcrypt.DefaultCost)
	if err != nil {
		t.Fatal(err)
	}
	// Hash yang sama ≠ teks asli, dan dua hash berbeda karena salt acak.
	if string(hash) == "rahasia123" {
		t.Error("hash sama dengan teks asli")
	}
	hash2, _ := bcrypt.GenerateFromPassword([]byte("rahasia123"), bcrypt.DefaultCost)
	if string(hash) == string(hash2) {
		t.Error("dua hash seharusnya berbeda (salt acak)")
	}
}
