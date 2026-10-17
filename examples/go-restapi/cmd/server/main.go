/*
============================================================

	cmd/server — titik masuk aplikasi.
	Alur: config → database → repository → service → router →
	     server + graceful shutdown.
	============================================================
*/
package main

import (
	"context"
	"errors"
	"example.com/go-restapi/internal/config"
	"example.com/go-restapi/internal/database"
	"example.com/go-restapi/internal/repository"
	"example.com/go-restapi/internal/router"
	"example.com/go-restapi/internal/service"
	"log"
	"net/http"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	// 1) Konfigurasi dari environment / .env
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("konfigurasi gagal: %v", err)
	}

	// 2) Koneksi database + connection pool
	db, err := database.Open(cfg)
	if err != nil {
		log.Fatalf("database gagal: %v", err)
	}
	defer db.Close()
	log.Println("terhubung ke MariaDB")

	// 3) Wiring: repository → service → router (dependency injection manual)
	authSvc := service.NewAuthService(repository.NewUserRepository(db), cfg.JWTSecret, cfg.JWTExpiry)
	prodSvc := service.NewProductService(repository.NewProductRepository(db))
	mux := router.New(authSvc, prodSvc)

	// 4) HTTP server dengan batas waktu agar request nakal tidak menggantung
	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	// 5) Jalankan server di goroutine agar main bisa menunggu sinyal
	go func() {
		log.Printf("server berjalan di http://localhost:%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("server gagal: %v", err)
		}
	}()

	// 6) Graceful shutdown: beri tahu server berhenti menerima
	//    request baru, tunggu yang berjalan selesai, lalu tutup.
	//    signal.NotifyContext menangani SIGINT (Ctrl+C) & SIGTERM.
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	<-ctx.Done()
	log.Println("menerima sinyal berhenti, mematikan server dengan aman...")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("gagal shutdown dengan bersih: %v", err)
	}
	log.Println("server berhenti")
}
