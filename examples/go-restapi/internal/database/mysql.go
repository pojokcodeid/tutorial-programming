/*
============================================================

	Package database — koneksi & pengaturan pool ke MariaDB.
	============================================================
*/
package database

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	_ "github.com/go-sql-driver/mysql" // driver: registrasi diri ke database/sql

	"example.com/go-restapi/internal/config"
)

// Open membuka koneksi ke MariaDB, mengatur connection pool,
// lalu memastikan database benar-benar bisa dijangkau (Ping).
func Open(cfg *config.Config) (*sql.DB, error) {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true&charset=utf8mb4&loc=Local",
		cfg.DBUser, cfg.DBPass, cfg.DBHost, cfg.DBPort, cfg.DBName)

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, fmt.Errorf("gagal membuka koneksi: %w", err)
	}

	// --- Connection pool ---
	// sql.Open TIDAK membuka koneksi; ia hanya menyiapkan pool.
	// Koneksi baru dibuat saat ada query pertama.
	db.SetMaxOpenConns(25)                 // maksimal koneksi terbuka
	db.SetMaxIdleConns(10)                 // koneksi yang disimpan untuk dipakai ulang
	db.SetConnMaxLifetime(5 * time.Minute) // umur maksimal satu koneksi

	// --- Uji koneksi sungguhan ---
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("gagal ping database: %w", err)
	}
	return db, nil
}
