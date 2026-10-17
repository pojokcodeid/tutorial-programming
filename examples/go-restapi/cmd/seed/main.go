/* ============================================================
   cmd/seed — menanam data awal: akun admin untuk development.
   Jalankan: go run ./cmd/seed
   Username: admin  |  Password: admin12345
   ============================================================ */
package main

import (
	"context"
	"errors"
	"log"

	"golang.org/x/crypto/bcrypt"

	"example.com/go-restapi/internal/config"
	"example.com/go-restapi/internal/database"
	"example.com/go-restapi/internal/model"
	"example.com/go-restapi/internal/repository"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("konfigurasi gagal: %v", err)
	}
	db, err := database.Open(cfg)
	if err != nil {
		log.Fatalf("database gagal: %v", err)
	}
	defer db.Close()

	hash, err := bcrypt.GenerateFromPassword([]byte("admin12345"), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("hash gagal: %v", err)
	}

	repo := repository.NewUserRepository(db)
	admin := &model.User{
		Username:     "admin",
		Email:        "admin@mail.com",
		PasswordHash: string(hash),
		Role:         model.RoleAdmin,
	}
	if err := repo.Create(context.Background(), admin); err != nil {
		if errors.Is(err, repository.ErrDuplicate) {
			log.Println("admin sudah ada — tidak apa-apa")
			return
		}
		log.Fatalf("gagal menanam admin: %v", err)
	}
	log.Println("admin berhasil dibuat (username: admin, password: admin12345)")
}
