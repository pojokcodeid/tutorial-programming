// Command seed mengisi database blog_go dengan data contoh.
//
// Jalankan sekali setelah server pertama (atau kapan pun, aman diulang):
//
//	go run ./cmd/seed
//
// Alternatif bila memiliki client mysql: mysql -u root -p blog_go < seed.sql
package main

import (
	"log"
	"time"

	"example.com/graphql-go-blog/graph/model"
	"example.com/graphql-go-blog/internal/database"

	"gorm.io/gorm/clause"
)

func main() {
	db := database.Connect()

	now := time.Now()
	users := []model.User{
		{Name: "Budi Santoso", Email: "budi@email.com", Role: "ADMIN", CreatedAt: now},
		{Name: "Ani Rahayu", Email: "ani@email.com", Role: "USER", CreatedAt: now},
		{Name: "Citra Lestari", Email: "citra@email.com", Role: "USER", CreatedAt: now},
	}
	// OnConflict: email unik — jika sudah ada, data lama dipertahankan (idempan)
	if err := db.Clauses(clause.OnConflict{DoNothing: true}).
		Create(&users).Error; err != nil {
		log.Fatalf("gagal menanam users: %v", err)
	}

	// Ambil id penulis yang benar (bisa saja sudah ada dari seed sebelumnya)
	var budi, ani, citra model.User
	db.Where("email = ?", "budi@email.com").First(&budi)
	db.Where("email = ?", "ani@email.com").First(&ani)
	db.Where("email = ?", "citra@email.com").First(&citra)

	// Tanam posts hanya bila belum ada (idempan — aman dijalankan berulang)
	var postCount int64
	db.Model(&model.Post{}).Count(&postCount)
	if postCount > 0 {
		log.Printf("✓ posts sudah ada (%d baris) — dilewati", postCount)
		return
	}

	posts := []model.Post{
		{Title: "Halo GraphQL di Go", Content: "Post pertama dari server GQLGen + GORM.", Published: true, AuthorID: budi.ID, CreatedAt: now},
		{Title: "GORM untuk Pemula", Content: "Cara kerja Preload, Where, Create, dan Save di GORM.", Published: false, AuthorID: budi.ID, CreatedAt: now},
		{Title: "REST vs GraphQL: Revisit", Content: "Mengapa GraphQL dipilih untuk API beragam klien.", Published: true, AuthorID: ani.ID, CreatedAt: now},
		{Title: "Draf: Microservices Go", Content: "Tulisan setengah jadi tentang memecah monolit.", Published: false, AuthorID: citra.ID, CreatedAt: now},
	}
	if err := db.Create(&posts).Error; err != nil {
		log.Fatalf("gagal menanam posts: %v", err)
	}

	var userCount int64
	db.Model(&model.User{}).Count(&userCount)
	db.Model(&model.Post{}).Count(&postCount)
	log.Printf("✓ seed selesai: %d users, %d posts", userCount, postCount)
}
