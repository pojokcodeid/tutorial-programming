// Package database menyediakan koneksi GORM ke MariaDB + AutoMigrate.
package database

import (
	"log"
	"os"
	"time"

	"example.com/graphql-go-blog/graph/model"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Connect membuka koneksi ke MariaDB dan memastikan tabel sesuai model.
//
// DSN: root:rootpassword@tcp(localhost:3306)/blog_go?parseTime=True
// — kredensial proyek tutorial (user root, password rootpassword).
// Untuk produksi, ambil dari environment: os.Getenv("DATABASE_URL").
func Connect() *gorm.DB {
	dsn := env("DATABASE_DSN",
		"root:rootpassword@tcp(localhost:3306)/blog_go?parseTime=True&charset=utf8mb4")

	gormLogger := logger.Default.LogMode(logger.Warn)
	if os.Getenv("DEBUG") == "1" {
		// DEBUG=1 menampilkan SQL GORM di terminal — berguna saat belajar
		gormLogger = logger.Default.LogMode(logger.Info)
	}

	// Pastikan database blog_go ada — buat otomatis bila belum.
	// (DSN server tanpa nama database: cukup untuk CREATE DATABASE)
	serverDSN := "root:rootpassword@tcp(localhost:3306)/?charset=utf8mb4"
	if server, err := gorm.Open(mysql.Open(serverDSN), &gorm.Config{Logger: gormLogger}); err == nil {
		_ = server.Exec("CREATE DATABASE IF NOT EXISTS blog_go " +
			"CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
		if sqlServer, e := server.DB(); e == nil {
			_ = sqlServer.Close()
		}
	}

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{Logger: gormLogger})
	if err != nil {
		log.Fatalf("gagal terhubung ke MariaDB (localhost:3306): %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("gagal mengakses koneksi dasar: %v", err)
	}
	// Pool koneksi: server Go melayani banyak request bersamaan
	sqlDB.SetMaxIdleConns(5)
	sqlDB.SetMaxOpenConns(20)
	sqlDB.SetConnMaxLifetime(time.Hour)

	// Buat tabel mengikuti struct model (setara prisma migrate dev)
	if err := db.AutoMigrate(&model.User{}, &model.Post{}); err != nil {
		log.Fatalf("gagal migrasi tabel: %v", err)
	}

	log.Println("✓ terhubung ke MariaDB localhost:3306 (blog_go)")
	return db
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
