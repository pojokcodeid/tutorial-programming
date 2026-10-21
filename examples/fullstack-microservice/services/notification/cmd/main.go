/*
notification-service — konsumer event order.created + API notifikasi TokoKita.

Port  : 8083
Data  : notification_db (MariaDB)
Peran : mendengarkan exchange tokokita.events, menyimpan notifikasi,

	dan menyajikannya ke frontend (yang polling tiap beberapa detik).

Logging : JSON terstruktur (internal/logx) — nasib SETIAP pesan broker

	(diterima, duplikat, rusak, gagal simpan, tersimpan) tercatat
	dengan event_id sebagai benang penelusurnya.
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

	"example.com/tokokita/internal/logx"
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

	log := logx.New("notification-service")

	db, err := waitForDB(log, dsn, 30, 2*time.Second)
	if err != nil {
		logx.Fatal(log, "database tidak pernah siap", "galat", err)
	}
	defer db.Close()
	log.Info("terhubung ke MariaDB", "database", "notification_db")

	st := store.New(db)

	// Konsumer berjalan di belakang: kalau koneksi RabbitMQ putus, koneksi
	// dicoba ulang terus sampai berhasil (ini pekerjaan penuh waktu service).
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	go func() {
		if err := consumer.Run(ctx, amqpURL, st, log); err != nil && !errors.Is(err, context.Canceled) {
			log.Error("konsumer berhenti", "galat", err)
		}
	}()

	api := httpapi.New(st, log)
	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           api.Router(),
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		log.Info("notification-service berjalan", "port", port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logx.Fatal(log, "server gagal", "galat", err)
		}
	}()

	<-ctx.Done()
	log.Info("sinyal berhenti diterima — mengakhiri dengan bersih")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Warn("gagal shutdown bersih", "galat", err)
	}
	log.Info("notification-service berhenti")
}

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
				db.SetMaxOpenConns(10)
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
