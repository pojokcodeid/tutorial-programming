/*
Package httpapi — lapisan HTTP order-service.

Alur buat pesanan (POST /orders):
 1. Validasi body masuk.
 2. Ambil data produk dari product-service (HTTP, timeout 2 detik).
 3. Hitung total, simpan pesanan (dengan kunci idempotensi).
 4. Terbitkan event order.created ke RabbitMQ — NOTIFIKASI TIDAK BOLEH
    menggagalkan pesanan, jadi kegagalan penerbitan hanya dicatat.
*/
package httpapi

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

	"example.com/tokokita/internal/logx"
	"example.com/tokokita/services/order/internal/publisher"
	"example.com/tokokita/services/order/internal/store"
)

type API struct {
	store       *store.Store
	catalogURL  string
	catalogHTTP *http.Client // timeout terpasang di sini, bukan per-request
	publisher   *publisher.Publisher
	log         *slog.Logger
}

func New(s *store.Store, catalogURL string, pub *publisher.Publisher, log *slog.Logger) *API {
	return &API{
		store:       s,
		catalogURL:  strings.TrimRight(catalogURL, "/"),
		catalogHTTP: &http.Client{Timeout: 2 * time.Second},
		publisher:   pub,
		log:         log,
	}
}

// Router memakai pola method + path net/http Go 1.22+; /healthz tidak
// dicatat agar log tidak dibanjiri baris healthcheck compose.
func (a *API) Router() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	mux.HandleFunc("GET /orders", a.list)
	mux.HandleFunc("POST /orders", a.create)
	return logx.Middleware(a.log, "/healthz")(mux)
}

type buatOrderRequest struct {
	ProductID int64  `json:"product_id"`
	Qty       int    `json:"qty"`
	Customer  string `json:"customer"`
}

func (a *API) create(w http.ResponseWriter, r *http.Request) {
	var req buatOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "body JSON tidak valid")
		return
	}
	if req.Qty <= 0 {
		writeError(w, http.StatusUnprocessableEntity, "qty harus lebih dari 0")
		return
	}
	if strings.TrimSpace(req.Customer) == "" {
		writeError(w, http.StatusUnprocessableEntity, "nama pelanggan wajib diisi")
		return
	}

	// 1) Validasi & ambil harga produk dari product-service (komunikasi sinkron).
	//    Kalau produk tidak dikenal, pesanan memang harus ditolak sekarang juga.
	prod, err := a.ambilProduk(r.Context(), req.ProductID)
	if errors.Is(err, errProdukTidakAda) {
		writeError(w, http.StatusUnprocessableEntity, "produk tidak ditemukan di katalog")
		return
	}
	if err != nil {
		// Downstream sedang bermasalah → jawab 502, jangan menebak harga.
		// Penyebabnya dicatat lengkap (galat jaringan/galat katalog) karena
		// status 502 saja tidak memberi tahu apa yang sebenarnya rusak.
		a.log.Error("panggilan katalog produk gagal",
			"produk_id", req.ProductID, "galat", err)
		writeError(w, http.StatusBadGateway, "katalog produk tidak tersedia")
		return
	}
	if prod.Stock < req.Qty {
		writeError(w, http.StatusUnprocessableEntity, "stok produk tidak mencukupi")
		return
	}

	// 2) Kunci idempotensi: klien boleh mengulang request yang sama tanpa
	//    takut pesanan tercatat dua kali.
	idemKey := r.Header.Get("Idempotency-Key")
	if idemKey == "" {
		idemKey = randomID()
	}

	order := store.Order{
		ProductID: prod.ID,
		Product:   prod.Name,
		Qty:       req.Qty,
		UnitPrice: prod.Price,
		Total:     prod.Price * req.Qty,
		Customer:  strings.TrimSpace(req.Customer),
		Status:    "confirmed",
	}
	saved, err := a.store.Create(r.Context(), order, idemKey)
	var dup *store.DupKeyError
	if errors.As(err, &dup) {
		// Request ulang: balas dengan pesanan lama, bukan membuat baru.
		// Kejadian ini dicatat karena pola retry klien yang berulang-lalu
		// sering menjadi petunjuk pertama saat ada masalah di jaringan.
		a.log.Info("pesanan ulang — idempotensi aktif",
			"order_id", dup.Existing.ID, "kunci", idemKey)
		writeJSON(w, http.StatusOK, dup.Existing)
		return
	}
	if err != nil {
		a.log.Error("gagal menyimpan pesanan", "kunci", idemKey, "galat", err)
		writeError(w, http.StatusInternalServerError, "gagal menyimpan pesanan")
		return
	}
	a.log.Info("pesanan dibuat",
		"order_id", saved.ID, "produk", saved.Product,
		"qty", saved.Qty, "total", saved.Total)

	// 3) Terbitkan event secara ASINKRON dari sudut pandang klien:
	//    kalau RabbitMQ sedang bermasalah, pesanan tetap sah — hanya
	//    notifikasi yang tertunda (dicatat untuk ditelusuri).
	ev := publisher.Event{
		EventID:   "ord-" + strconv.FormatInt(saved.ID, 10) + "-" + randomID()[:8],
		OrderID:   saved.ID,
		Customer:  saved.Customer,
		Product:   saved.Product,
		Qty:       saved.Qty,
		Total:     saved.Total,
		CreatedAt: saved.CreatedAt,
	}
	if err := a.publisher.Publish(r.Context(), ev); err != nil {
		a.log.Warn("event gagal diterbitkan — notifikasi tertunda",
			"event", publisher.RoutingKey, "event_id", ev.EventID,
			"order_id", saved.ID, "galat", err)
	} else {
		a.log.Info("event diterbitkan",
			"event", publisher.RoutingKey, "event_id", ev.EventID, "order_id", saved.ID)
	}

	writeJSON(w, http.StatusCreated, saved)
}

func (a *API) list(w http.ResponseWriter, r *http.Request) {
	list, err := a.store.List(r.Context())
	if err != nil {
		a.log.Error("gagal membaca daftar pesanan", "galat", err)
		writeError(w, http.StatusInternalServerError, "gagal membaca pesanan")
		return
	}
	if list == nil {
		list = []store.Order{}
	}
	writeJSON(w, http.StatusOK, list)
}

/* ---------- HTTP client ke product-service ---------- */

type produk struct {
	ID    int64  `json:"id"`
	Name  string `json:"name"`
	Price int    `json:"price"`
	Stock int    `json:"stock"`
}

var errProdukTidakAda = errors.New("produk tidak ada")

// ambilProduk memanggil GET product-service /products/{id} dengan timeout
// yang sudah dipasang pada http.Client — termasuk waktu baca body respons.
func (a *API) ambilProduk(ctx context.Context, id int64) (produk, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet,
		fmt.Sprintf("%s/products/%d", a.catalogURL, id), nil)
	if err != nil {
		return produk{}, err
	}
	res, err := a.catalogHTTP.Do(req)
	if err != nil {
		return produk{}, err
	}
	defer res.Body.Close()

	if res.StatusCode == http.StatusNotFound {
		return produk{}, errProdukTidakAda
	}
	if res.StatusCode != http.StatusOK {
		return produk{}, fmt.Errorf("katalog membalas %d", res.StatusCode)
	}
	// Batasi ukuran body agar respons nakal tidak menghabiskan memori.
	body, err := io.ReadAll(io.LimitReader(res.Body, 1<<20))
	if err != nil {
		return produk{}, err
	}
	var p produk
	if err := json.Unmarshal(body, &p); err != nil {
		return produk{}, err
	}
	return p, nil
}

/* ---------- utilitas ---------- */

// randomID menghasilkan pengenal acak 16 karakter (hex) dari crypto/rand.
func randomID() string {
	b := make([]byte, 8)
	if _, err := rand.Read(b); err != nil {
		return strconv.FormatInt(time.Now().UnixNano(), 36)
	}
	return hex.EncodeToString(b)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"message": msg})
}
