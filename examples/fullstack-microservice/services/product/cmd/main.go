/*
product-service — REST API katalog produk TokoKita.

Port      : 8081
Data      : product_db (MariaDB) + cache di Redis (pola cache-aside)
Endpoint  : GET/POST /products, GET/PUT/DELETE /products/{id}, /healthz
*/
package main

import (
	"context"
	"database/sql"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/redis/go-redis/v9"

	"example.com/tokokita/services/product/internal/cache"
	"example.com/tokokita/services/product/internal/httpapi"
	"example.com/tokokita/services/product/internal/store"
)

// env membaca variabel lingkungan dengan nilai bawaan — konfigurasi tidak
// pernah ditulis mati di kode (praktik 12-factor).
func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func main() {
	port := env("PORT", "8081")
	dsn := env("DB_DSN", "product_svc:product-local@tcp(localhost:3306)/product_db?parseTime=true&charset=utf8mb4")
	redisAddr := env("REDIS_ADDR", "localhost:6379")
	cacheTTL := 30 * time.Second

	// 1) Tunggu MariaDB siap — container DB sering lebih lambat start daripada aplikasi.
	db, err := waitForDB(dsn, 30, 2*time.Second)
	if err != nil {
		log.Fatalf("database tidak pernah siap: %v", err)
	}
	defer db.Close()
	log.Println("terhubung ke MariaDB (product_db)")

	// 2) Redis untuk cache. Bila gagal, service TETAP jalan tanpa cache
	//    (degradasi terkendali) — cache bukan syarat hidup aplikasi.
	rdb := redis.NewClient(&redis.Options{Addr: redisAddr})
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Printf("PERINGATAN: Redis tidak tersedia (%v) — berjalan tanpa cache", err)
	} else {
		log.Println("terhubung ke Redis")
	}
	defer rdb.Close()

	// 3) Wiring dependency: store (MariaDB) → cache (Redis) → HTTP API.
	api := httpapi.New(store.New(db), cache.New(rdb), cacheTTL)

	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           api.Router(),
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		log.Printf("product-service berjalan di http://localhost:%s", port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("server gagal: %v", err)
		}
	}()

	// 4) Graceful shutdown: beri request yang sedang berjalan waktu selesai.
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	shutdownCtx, cancel2 := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel2()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("gagal shutdown bersih: %v", err)
	}
	log.Println("product-service berhenti")
}

// waitForDB mencoba koneksi berulang karena container database butuh waktu
// untuk menyiapkan diri saat komposer baru dinyalakan.
func waitForDB(dsn string, attempts int, delay time.Duration) (*sql.DB, error) {
	var db *sql.DB
	var err error
	for i := 0; i < attempts; i++ {
		db, err = sql.Open("mysql", dsn)
		if err == nil {
			pingCtx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
			err = db.PingContext(pingCtx)
			cancel()
			if err == nil {
				db.SetMaxOpenConns(20)
				db.SetMaxIdleConns(5)
				db.SetConnMaxLifetime(30 * time.Minute)
				return db, nil
			}
		}
		log.Printf("database belum siap (percobaan %d/%d): %v", i+1, attempts, err)
		time.Sleep(delay)
	}
	return nil, err
}
