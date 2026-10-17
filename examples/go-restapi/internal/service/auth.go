/*
============================================================

	Package service — logika bisnis authentication/authorization.
	- Register: validasi input + hash password (bcrypt)
	- Login: verifikasi password + terbitkan JWT
	- ParseToken: verifikasi & baca isi JWT
	============================================================
*/
package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"example.com/go-restapi/internal/model"
	"example.com/go-restapi/internal/repository"
)

// Error sentinel untuk dipetakan ke status HTTP di handler.
var (
	ErrValidation   = errors.New("validasi gagal")
	ErrUnauthorized = errors.New("username atau password salah")
	ErrConflict     = errors.New("username atau email sudah dipakai")
	ErrForbidden    = errors.New("akses ditolak")
	ErrNotFound     = errors.New("data tidak ditemukan")
)

// RegisterInput adalah payload registrasi dari klien.
type RegisterInput struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

// Validate memvalidasi data registrasi.
func (in RegisterInput) Validate() error {
	var errs []string
	if u := strings.TrimSpace(in.Username); len(u) < 3 || len(u) > 50 {
		errs = append(errs, "username harus 3–50 karakter")
	}
	if !strings.Contains(in.Email, "@") || len(in.Email) > 100 {
		errs = append(errs, "email tidak valid")
	}
	if len(in.Password) < 8 {
		errs = append(errs, "password minimal 8 karakter")
	}
	if len(errs) > 0 {
		return fmt.Errorf("%w: %s", ErrValidation, strings.Join(errs, "; "))
	}
	return nil
}

// LoginInput adalah payload login dari klien.
type LoginInput struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// Claims adalah data di dalam JWT yang kita buat sendiri
// (identitas user + peran) ditambah registered claims bawaan library.
type Claims struct {
	UserID int64  `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// AuthService adalah kontrak layanan autentikasi.
type AuthService interface {
	Register(ctx context.Context, in RegisterInput) (*model.User, error)
	Login(ctx context.Context, in LoginInput) (string, *model.User, error)
	ParseToken(ctx context.Context, raw string) (*Claims, error)
}

type authService struct {
	users     repository.UserRepository
	jwtSecret []byte
	jwtExpiry time.Duration
}

// NewAuthService membuat AuthService dengan dependensi & konfigurasi JWT.
func NewAuthService(users repository.UserRepository, jwtSecret string, jwtExpiry time.Duration) AuthService {
	return &authService{
		users:     users,
		jwtSecret: []byte(jwtSecret),
		jwtExpiry: jwtExpiry,
	}
}

func (s *authService) Register(ctx context.Context, in RegisterInput) (*model.User, error) {
	if err := in.Validate(); err != nil {
		return nil, err
	}

	// Hash password: bcrypt otomatis menambahkan salt acak.
	hash, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	user := &model.User{
		Username:     strings.TrimSpace(in.Username),
		Email:        strings.TrimSpace(in.Email),
		PasswordHash: string(hash),
		Role:         model.RoleUser, // default peran: user
	}
	if err := s.users.Create(ctx, user); err != nil {
		if errors.Is(err, repository.ErrDuplicate) {
			return nil, ErrConflict
		}
		return nil, err
	}
	return user, nil
}

func (s *authService) Login(ctx context.Context, in LoginInput) (string, *model.User, error) {
	user, err := s.users.FindByUsername(ctx, strings.TrimSpace(in.Username))
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			// Pesan sengaja sama dengan password salah → tidak bocorkan username ada/tidak.
			return "", nil, ErrUnauthorized
		}
		return "", nil, err
	}

	// Bandingkan hash tersimpan dengan password mentah.
	if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(in.Password)) != nil {
		return "", nil, ErrUnauthorized
	}

	token, err := s.generateToken(user)
	if err != nil {
		return "", nil, err
	}
	return token, user, nil
}

// generateToken menandatangani JWT berisi identitas & peran user.
func (s *authService) generateToken(u *model.User) (string, error) {
	now := time.Now()
	claims := &Claims{
		UserID: u.ID,
		Role:   u.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   fmt.Sprintf("%d", u.ID),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(s.jwtExpiry)),
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(s.jwtSecret)
}

// ParseToken memverifikasi tanda tangan & masa berlaku token,
// lalu mengembalikan klaim yang sudah dipercaya.
func (s *authService) ParseToken(ctx context.Context, raw string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(raw, claims, func(t *jwt.Token) (any, error) {
		// Pastikan algoritma benar-benar HMAC (bukan "none" / RSA palsu)
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("metode tanda tangan tak dikenal: %v", t.Header["alg"])
		}
		return s.jwtSecret, nil
	}, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))
	if err != nil || !token.Valid {
		return nil, ErrUnauthorized
	}
	return claims, nil
}
