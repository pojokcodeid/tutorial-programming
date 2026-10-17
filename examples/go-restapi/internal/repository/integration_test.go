//go:build integration

/* ============================================================
   INTEGRATION TEST repository Product — butuh MariaDB sungguhan.
   File ini punya build tag "integration", sehingga TIDAK ikut
   dijalankan oleh `go test ./...` biasa. Jalankan khusus dengan:

       go test -tags=integration ./internal/repository/ -v

   Database yang dipakai: gorestapi_test (lihat env DB_TEST_*).
   Setiap test dibersihkan lebih dulu supaya hasilnya deterministik.
   ============================================================ */
package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"os"
	"strings"
	"testing"
	"time"

	_ "github.com/go-sql-driver/mysql"

	"example.com/go-restapi/internal/model"
)

// openTestDB membuka koneksi ke database TEST (bukan database aplikasi).
func openTestDB(t *testing.T) *sql.DB {
	t.Helper()

	host := envOr("DB_TEST_HOST", "localhost")
	port := envOr("DB_TEST_PORT", "3306")
	user := envOr("DB_TEST_USER", "root")
	pass := envOr("DB_TEST_PASS", "root")
	name := envOr("DB_TEST_NAME", "gorestapi_test")

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true&charset=utf8mb4", user, pass, host, port, name)
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		t.Fatalf("gagal membuka koneksi test: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		t.Skipf("MariaDB tidak tersedia, lewati integration test: %v", err)
	}

	// Pastikan tabel ada (idempoten): jalankan migrasi.
	applyMigrations(t, db)
	return db
}

// applyMigrations mengeksekusi file migrasi SQL.
// Driver MySQL default hanya menerima SATU statement per eksekusi,
// jadi file dipecah per tanda ";" dulu.
func applyMigrations(t *testing.T, db *sql.DB) {
	t.Helper()
	data, err := os.ReadFile("../../migrations/001_init.sql")
	if err != nil {
		t.Fatalf("gagal membaca migrasi: %v", err)
	}
	for _, stmt := range strings.Split(string(data), ";") {
		stmt = strings.TrimSpace(stmt)
		if stmt == "" || strings.HasPrefix(stmt, "--") {
			continue
		}
		if _, err := db.Exec(stmt); err != nil {
			t.Fatalf("gagal menjalankan migrasi: %v\nstatement: %s", err, stmt)
		}
	}
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// cleanProducts menghapus semua baris produk agar test tidak saling memengaruhi.
func cleanProducts(t *testing.T, db *sql.DB) {
	t.Helper()
	if _, err := db.Exec(`DELETE FROM products`); err != nil {
		t.Fatalf("gagal membersihkan products: %v", err)
	}
}

// seedUser menanam satu user sebagai pemilik produk (butuh FK created_by).
func seedUser(t *testing.T, db *sql.DB, username string) int64 {
	t.Helper()
	res, err := db.Exec(
		`INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, 'user')
		 ON DUPLICATE KEY UPDATE id = id`, // idempoten: kalau sudah ada, pakai ID lama
		username, username+"@mail.com", "$2a$10$fakefakefakefakefake",
	)
	if err != nil {
		t.Fatalf("gagal menanam user: %v", err)
	}
	// Cari ID user (bisa jadi sudah ada dari test sebelumnya).
	var id int64
	if err := db.QueryRow(`SELECT id FROM users WHERE username = ?`, username).Scan(&id); err != nil {
		t.Fatalf("gagal membaca id user: %v", err)
	}
	_ = res
	return id
}

func TestIntegration_ProductCRUD(t *testing.T) {
	db := openTestDB(t)
	defer db.Close()
	cleanProducts(t, db)

	repo := NewProductRepository(db)
	ctx := context.Background()
	ownerID := seedUser(t, db, "pemilik")

	// --- CREATE ---
	p := &model.Product{Name: "Laptop", Description: "Core i7", Price: 9_500_000, Stock: 4, CreatedBy: ownerID}
	if err := repo.Create(ctx, p); err != nil {
		t.Fatalf("Create() error = %v", err)
	}
	if p.ID == 0 {
		t.Fatal("ID produk tidak terisi setelah insert")
	}

	// --- FIND BY ID ---
	got, err := repo.FindByID(ctx, p.ID)
	if err != nil {
		t.Fatalf("FindByID() error = %v", err)
	}
	if got.Name != "Laptop" || got.Price != 9_500_000 || got.CreatedBy != ownerID {
		t.Errorf("FindByID() = %+v, want nama/harga/pemilik sesuai", got)
	}

	// --- UPDATE ---
	got.Name = "Laptop Gaming"
	got.Price = 12_000_000
	if err := repo.Update(ctx, got); err != nil {
		t.Fatalf("Update() error = %v", err)
	}
	again, _ := repo.FindByID(ctx, p.ID)
	if again.Name != "Laptop Gaming" || again.Price != 12_000_000 {
		t.Errorf("setelah update = %+v", again)
	}

	// --- COUNT & LIST ---
	total, err := repo.Count(ctx)
	if err != nil {
		t.Fatalf("Count() error = %v", err)
	}
	if total != 1 {
		t.Errorf("Count() = %d, want 1", total)
	}
	list, err := repo.List(ctx, 10, 0)
	if err != nil {
		t.Fatalf("List() error = %v", err)
	}
	if len(list) != 1 {
		t.Errorf("len(List()) = %d, want 1", len(list))
	}

	// --- DELETE ---
	if err := repo.Delete(ctx, p.ID); err != nil {
		t.Fatalf("Delete() error = %v", err)
	}
	if _, err := repo.FindByID(ctx, p.ID); !errors.Is(err, ErrNotFound) {
		t.Errorf("setelah delete FindByID() error = %v, want ErrNotFound", err)
	}
}

func TestIntegration_ProductTidakDitemukan(t *testing.T) {
	db := openTestDB(t)
	defer db.Close()
	cleanProducts(t, db)

	repo := NewProductRepository(db)
	ctx := context.Background()

	if _, err := repo.FindByID(ctx, 424242); !errors.Is(err, ErrNotFound) {
		t.Errorf("FindByID(424242) error = %v, want ErrNotFound", err)
	}
	if err := repo.Delete(ctx, 424242); !errors.Is(err, ErrNotFound) {
		t.Errorf("Delete(424242) error = %v, want ErrNotFound", err)
	}
}

func TestIntegration_UserCreateDuplikat(t *testing.T) {
	db := openTestDB(t)
	defer db.Close()
	if _, err := db.Exec(`DELETE FROM users WHERE username = 'penduplikat'`); err != nil {
		t.Fatal(err)
	}

	repo := NewUserRepository(db)
	ctx := context.Background()

	u := &model.User{Username: "penduplikat", Email: "penduplikat@mail.com", PasswordHash: "x", Role: model.RoleUser}
	if err := repo.Create(ctx, u); err != nil {
		t.Fatalf("Create() pertama error = %v", err)
	}

	// Username sama → harus ErrDuplicate (unik di database).
	err := repo.Create(ctx, &model.User{Username: "penduplikat", Email: "beda@mail.com", PasswordHash: "x", Role: model.RoleUser})
	if !errors.Is(err, ErrDuplicate) {
		t.Errorf("Create() duplikat error = %v, want ErrDuplicate", err)
	}

	// Bersihkan supaya test ini idempoten.
	if _, err := db.Exec(`DELETE FROM users WHERE username = 'penduplikat'`); err != nil {
		t.Fatal(err)
	}
}
