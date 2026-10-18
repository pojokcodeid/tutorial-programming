// Package storage menentukan database mana yang dipakai aplikasi.
//
// Ini adalah JALUR TUNGGAL pemilihan database: cukup mengganti nilai
// TODO_DB_DRIVER (atau argumen Open), seluruh aplikasi berpindah database
// tanpa menyentuh kode UI, service, maupun logika bisnis.
package storage

import (
	"fmt"
	"os"
	"strings"

	"example.com/go-todo-app/internal/repository"
	"example.com/go-todo-app/internal/repository/memory"
	"example.com/go-todo-app/internal/repository/mysql"
	"example.com/go-todo-app/internal/repository/sqlite"
)

// FromEnv membuka repository sesuai environment variable:
//
//	TODO_DB_DRIVER   sqlite (default) | mysql | memory
//	TODO_DB_DSN      tergantung driver (lihat defaultDSN)
func FromEnv() (repository.Repository, error) {
	driver := env("TODO_DB_DRIVER", "sqlite")
	return Open(driver, env("TODO_DB_DSN", defaultDSN(driver)))
}

// Open membangun repository berdasarkan nama driver.
func Open(driver, dsn string) (repository.Repository, error) {
	switch driver {
	case "sqlite":
		return sqlite.Open(dsn)
	case "mysql":
		return mysql.Open(dsn)
	case "memory":
		// Tidak memakai DSN — datanya murni di RAM.
		return memory.New(), nil
	default:
		return nil, fmt.Errorf("driver %q tidak dikenal (pilihan: sqlite, mysql, memory)", driver)
	}
}

func defaultDSN(driver string) string {
	if driver == "mysql" {
		return "todo:rahasia@tcp(127.0.0.1:3306)/todo_app?charset=utf8mb4&parseTime=false&loc=UTC"
	}
	return "todo.db"
}

func env(key, fallback string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return fallback
}
