/*
notification-service — konsumer event order.created + API notifikasi TokoKita.

Port  : 8083
Data  : notification_db (MariaDB)
Peran : mendengarkan exchange tokokita.events, menyimpan notifikasi,

	dan menyajikannya ke frontend (yang polling tiap beberapa detik).
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

	"example.com/tokokita/services/notification/internal/consumer"
	"example.com/tokokita/services/notification/internal/httpapi"
	"example.com/tokokita/services/notification/internal/store"
)

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func main() {
	port := env("PORT", "8083")
	dsn := env("DB_DSN", "notification_svc:notification-local@tcp(localhost:3306)/notification_db?parseTime=true&charset=utf8mb4")
	amqpURL := env("AMQP_URL", "amqp://guest:guest@localhost:5672/")

	db, err := waitForDB(dsn, 30, 2*time.Second)
	if err != nil {
		log.Fatalf("database tidak pernah siap: %v", err)
	}
	defer db.Close()
	log.Println("terhubung ke MariaDB (notification_db)")

	st := store.New(db)

	// Konsumer berjalan di belakang: kalau koneksi RabbitMQ putus, koneksi
	// dicoba ulang terus sampai berhasil (ini pekerjaan penuh waktu service).
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	go func() {
		if err := consumer.Run(ctx, amqpURL, st); err != nil && !errors.Is(err, context.Canceled) {
			log.Printf("konsumer berhenti: %v", err)
		}
	}()

	api := httpapi.New(st)
	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           api.Router(),
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		log.Printf("notification-service berjalan di http://localhost:%s", port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("server gagal: %v", err)
		}
	}()

	<-ctx.Done()
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("gagal shutdown bersih: %v", err)
	}
	log.Println("notification-service berhenti")
}

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
				db.SetMaxOpenConns(10)
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
