/*
product-service — REST API katalog produk TokoKita.

Port      : 8081
Data      : product_db (MariaDB) + cache di Redis (pola cache-aside)
Endpoint  : GET/POST /products, GET/PUT/DELETE /products/{id}, /healthz
Logging   : JSON terstruktur (internal/logx) — setiap baris satu kejadian
*/
package main

import (
	"context"
	"database/sql"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/redis/go-redis/v9"

	"example.com/tokokita/internal/logx"
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

	log := logx.New("product-service")

	// 1) Tunggu MariaDB siap — container DB sering lebih lambat start daripada aplikasi.
	db, err := waitForDB(log, dsn, 30, 2*time.Second)
	if err != nil {
		logx.Fatal(log, "database tidak pernah siap", "galat", err)
	}
	defer db.Close()
	log.Info("terhubung ke MariaDB", "database", "product_db")

	// 2) Redis untuk cache. Bila gagal, service TETAP jalan tanpa cache
	//    (degradasi terkendali) — cache bukan syarat hidup aplikasi.
	rdb := redis.NewClient(&redis.Options{Addr: redisAddr})
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Warn("Redis tidak tersedia — berjalan tanpa cache", "galat", err)
	} else {
		log.Info("terhubung ke Redis", "alamat", redisAddr)
	}
	defer rdb.Close()

	// 3) Wiring dependency: store (MariaDB) → cache (Redis) → HTTP API.
	//    Logger ikut diteruskan supaya tiap lapisan bisa mencatat kejadiannya.
	api := httpapi.New(store.New(db), cache.New(rdb), cacheTTL, log)

	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           api.Router(),
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		log.Info("product-service berjalan", "port", port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logx.Fatal(log, "server gagal", "galat", err)
		}
	}()

	// 4) Graceful shutdown: beri request yang sedang berjalan waktu selesai.
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Info("sinyal berhenti diterima — mengakhiri dengan bersih")
	shutdownCtx, cancel2 := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel2()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Warn("gagal shutdown bersih", "galat", err)
	}
	log.Info("product-service berhenti")
}

// waitForDB mencoba koneksi berulang karena container database butuh waktu
// untuk menyiapkan diri saat komposer baru dinyalakan.
func waitForDB(log *slog.Logger, dsn string, attempts int, delay time.Duration) (*sql.DB, error) {
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
		log.Info("database belum siap", "percobaan", i+1, "maks", attempts, "galat", err)
		time.Sleep(delay)
	}
	return nil, err
}
