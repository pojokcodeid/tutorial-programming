/*
============================================================

	Package config — membaca konfigurasi aplikasi dari environment.
	File .env (opsional) dimuat lebih dulu, lalu environment
	yang sudah diset secara eksternal tetap diutamakan.
	============================================================
*/
package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

// Config adalah kumpulan seluruh konfigurasi aplikasi.
type Config struct {
	Port      string
	DBHost    string
	DBPort    string
	DBUser    string
	DBPass    string
	DBName    string
	JWTSecret string
	JWTExpiry time.Duration
}

// Load membaca konfigurasi dari environment variable.
// Setiap nilai punya default yang cocok untuk development lokal.
func Load() (*Config, error) {
	loadDotEnv(".env")

	expiryMin, err := strconv.Atoi(getEnv("JWT_EXPIRY_MINUTES", "60"))
	if err != nil || expiryMin <= 0 {
		return nil, fmt.Errorf("JWT_EXPIRY_MINUTES tidak valid: %q", os.Getenv("JWT_EXPIRY_MINUTES"))
	}

	secret := getEnv("JWT_SECRET", "dev-secret-ganti-saya")
	if secret == "dev-secret-ganti-saya" {
		fmt.Println("[config] PERINGATAN: memakai JWT_SECRET default — jangan dipakai di produksi!")
	}

	return &Config{
		Port:      getEnv("APP_PORT", "8080"),
		DBHost:    getEnv("DB_HOST", "localhost"),
		DBPort:    getEnv("DB_PORT", "3306"),
		DBUser:    getEnv("DB_USER", "root"),
		DBPass:    getEnv("DB_PASS", "root"),
		DBName:    getEnv("DB_NAME", "gorestapi_app"),
		JWTSecret: secret,
		JWTExpiry: time.Duration(expiryMin) * time.Minute,
	}, nil
}

func getEnv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}

// loadDotEnv membaca file .env sederhana (KEY=VALUE per baris)
// tanpa dependensi eksternal. Variabel yang SUDAH ada di
// environment tidak ditimpa.
func loadDotEnv(path string) {
	data, err := os.ReadFile(path)
	if err != nil {
		return // file .env bersifat opsional
	}
	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		key, val, found := strings.Cut(line, "=")
		if !found {
			continue
		}
		key = strings.TrimSpace(key)
		val = strings.Trim(strings.TrimSpace(val), `"'`)
		if _, exists := os.LookupEnv(key); !exists {
			os.Setenv(key, val)
		}
	}
}
