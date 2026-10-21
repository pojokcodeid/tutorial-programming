/*
Package logx — logging terstruktur (JSON) yang dipakai ketiga service TokoKita.

Setiap baris log adalah SATU objek JSON di stdout, sehingga mudah dicari dan
difilter oleh alat pengumpul log container (podman logs, jq, Loki, dll):

	{"time":"2026-10-20T10:15:04.123Z","level":"INFO","msg":"http_request",
	 "service":"order-service","method":"POST","path":"/orders",
	 "status":201,"durasi_ms":1.234,"remote":"10.88.0.5:52344"}

Dua aturan yang dipegang di seluruh proyek:
  - Logger dibuat SEKALI di main() lalu diteruskan lewat konstruktor —
    bukan variabel global — supaya ketergantungan tetap terlihat eksplisit.
  - Satu baris = satu kejadian; gunakan atribut bernama (order_id, event_id)
    alih-alih menyusun kalimat, agar log bisa dicari dengan jq/grep.
*/
package logx

import (
	"log/slog"
	"net/http"
	"os"
	"time"
)

// New membuat logger JSON berlabel nama service, menulis ke stdout.
func New(service string) *slog.Logger {
	return slog.New(slog.NewJSONHandler(os.Stdout, nil)).With("service", service)
}

// Fatal mencatat kegagalan fatal lalu keluar dengan kode 1 — pengganti
// log.Fatalf pada logger terstruktur (slog tidak memiliki Fatalf).
func Fatal(log *slog.Logger, msg string, args ...any) {
	log.Error(msg, args...)
	os.Exit(1)
}

// Middleware mencatat setiap permintaan sebagai satu baris log JSON:
// method, path, kode status, durasi, dan alamat klien — trafik antar
// service yang selama ini hanya terlihat di akses log nginx.
//
// Path yang dicantumkan di skip (mis. /healthz yang dipantau tiap beberapa
// detik oleh compose) tetap dilayani tetapi TIDAK dicatat, agar log tidak
// dibanjiri baris yang tidak memberi informasi baru.
func Middleware(log *slog.Logger, skip ...string) func(http.Handler) http.Handler {
	lewat := make(map[string]bool, len(skip))
	for _, p := range skip {
		lewat[p] = true
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if lewat[r.URL.Path] {
				next.ServeHTTP(w, r)
				return
			}
			start := time.Now()
			sw := &statusWriter{ResponseWriter: w, status: http.StatusOK}
			next.ServeHTTP(sw, r)

			// Sebagian handler menandai lapisan mana yang melayani lewat
			// header khusus (mis. X-Cache HIT/MISS pada product-service).
			// Header itu ikut disalin ke log supaya riwayat cache terbaca
			// dari satu baris, tanpa perlu menebak-nebak dari status 200.
			args := []any{
				slog.String("method", r.Method),
				slog.String("path", r.URL.Path),
				slog.Int("status", sw.status),
				slog.Float64("durasi_ms", float64(time.Since(start).Microseconds())/1000),
				slog.String("remote", r.RemoteAddr),
			}
			if c := sw.Header().Get("X-Cache"); c != "" {
				args = append(args, slog.String("x_cache", c))
			}
			log.Info("http_request", args...)
		})
	}
}

// statusWriter mengingat kode status yang ditulis handler (WriteHeader
// pertama yang menang) agar middleware ikut bisa mencatatnya.
type statusWriter struct {
	http.ResponseWriter
	status      int
	wroteHeader bool
}

func (w *statusWriter) WriteHeader(status int) {
	if !w.wroteHeader {
		w.status = status
		w.wroteHeader = true
	}
	w.ResponseWriter.WriteHeader(status)
}
