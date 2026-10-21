/*
order-service — API pembuatan pesanan TokoKita.

Port    : 8082
Data    : order_db (MariaDB)
Peran   : memvalidasi produk ke product-service (HTTP), menyimpan pesanan,

	lalu menerbitkan event "order.created" ke RabbitMQ agar
	notification-service bisa mengirim notifikasi tanpa memblokir order.

Logging : JSON terstruktur (internal/logx) — kejadian bisnis (pesanan

	dibuat, ulang-ulang idempoten, event diterbitkan/gagal) ikut
	tercatat berdampingan dengan lalu lintas HTTP.
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
	amqp "github.com/rabbitmq/amqp091-go"

	"example.com/tokokita/internal/logx"
	"example.com/tokokita/services/order/internal/httpapi"
	"example.com/tokokita/services/order/internal/publisher"
	"example.com/tokokita/services/order/internal/store"
)

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func main() {
	port := env("PORT", "8082")
	dsn := env("DB_DSN", "order_svc:order-local@tcp(localhost:3306)/order_db?parseTime=true&charset=utf8mb4")
	catalogURL := env("CATALOG_URL", "http://localhost:8081")
	amqpURL := env("AMQP_URL", "amqp://guest:guest@localhost:5672/")

	log := logx.New("order-service")

	// 1) Tunggu MariaDB siap (container DB sering start belakangan).
	db, err := waitForDB(log, dsn, 30, 2*time.Second)
	if err != nil {
		logx.Fatal(log, "database tidak pernah siap", "galat", err)
	}
	defer db.Close()
	log.Info("terhubung ke MariaDB", "database", "order_db")

	// 2) Koneksi RabbitMQ dengan percobaan ulang — broker boleh siap
	//    setelah aplikasi. Bila tetap gagal, service mati: pesanan yang
	//    tidak bisa diberitahukan ke pengguna adalah cacat serius.
	conn, err := waitForAMQP(log, amqpURL, 30, 2*time.Second)
	if err != nil {
		logx.Fatal(log, "RabbitMQ tidak pernah siap", "galat", err)
	}
	defer conn.Close()
	pub := publisher.New(conn, log)
	log.Info("terhubung ke RabbitMQ")

	// 3) Wiring: store + HTTP client product-service + publisher event.
	api := httpapi.New(store.New(db), catalogURL, pub, log)
	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           api.Router(),
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		log.Info("order-service berjalan", "port", port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logx.Fatal(log, "server gagal", "galat", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Info("sinyal berhenti diterima — mengakhiri dengan bersih")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Warn("gagal shutdown bersih", "galat", err)
	}
	log.Info("order-service berhenti")
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

func waitForAMQP(log *slog.Logger, url string, attempts int, delay time.Duration) (*amqp.Connection, error) {
	var conn *amqp.Connection
	var err error
	for i := 0; i < attempts; i++ {
		conn, err = amqp.Dial(url)
		if err == nil {
			return conn, nil
		}
		log.Info("RabbitMQ belum siap", "percobaan", i+1, "maks", attempts, "galat", err)
		time.Sleep(delay)
	}
	return nil, err
}
