/*
Package consumer — konsumer RabbitMQ notification-service.

Beberapa keputusan penting yang dipakai di produksi nyata:
  - autoAck = false — pesan baru di-ACK setelah benar-benar tersimpan;
    bila service crash di tengah jalan, pesan dikirim ulang oleh broker.
  - Qos(prefetch) membatasi berapa pesan yang dikirim sekaligus —
    konsumen kecil tidak boleh dibanjiri.
  - INSERT ... dengan kunci UNIQUE event_id membuat pemrosesan ganda
    (misal setelah reconnect) menjadi tidak berbahaya: baris kedua ditolak
    database, tapi pesan tetap di-ACK.
*/
package consumer

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"strconv"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"

	"example.com/tokokita/services/notification/internal/store"
)

const (
	ExchangeName = "tokokita.events"
	QueueName    = "notification.orders"
	BindingKey   = "order.created"
)

// event adalah salinan kontrak event dari order-service.
type storeEvent struct {
	EventID   string    `json:"event_id"`
	OrderID   int64     `json:"order_id"`
	Customer  string    `json:"customer"`
	Product   string    `json:"product"`
	Qty       int       `json:"qty"`
	Total     int       `json:"total"`
	CreatedAt time.Time `json:"created_at"`
}

// Run menjalankan siklus: hubungkan → deklarasikan topologi → konsumsi.
// Selama ctx belum batal, setiap putus dicoba hubungkan ulang.
// Nasib setiap pesan dicatat sebagai satu baris log JSON dengan event_id
// sebagai benang penelusur (bisa dicocokkan dengan log order-service).
func Run(ctx context.Context, url string, st *store.Store, log *slog.Logger) error {
	for attempt := 1; ; attempt++ {
		if ctx.Err() != nil {
			return ctx.Err()
		}
		err := once(ctx, url, st, log)
		if ctx.Err() != nil {
			return ctx.Err()
		}
		log.Warn("koneksi AMQP putus — mencoba ulang dalam 3 detik",
			"percobaan", attempt, "galat", err)
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(3 * time.Second):
		}
	}
}

func once(ctx context.Context, url string, st *store.Store, log *slog.Logger) error {
	conn, err := amqp.Dial(url)
	if err != nil {
		return err
	}
	defer conn.Close()

	ch, err := conn.Channel()
	if err != nil {
		return err
	}
	defer ch.Close()

	// Deklarasi topologi (idempoten — aman diulang setiap start).
	if err := ch.ExchangeDeclare(ExchangeName, "topic", true, false, false, false, nil); err != nil {
		return err
	}
	q, err := ch.QueueDeclare(QueueName, true, false, false, false, nil)
	if err != nil {
		return err
	}
	if err := ch.QueueBind(q.Name, BindingKey, ExchangeName, false, nil); err != nil {
		return err
	}
	// Batasi pengiriman: 10 pesan tanpa ACK belum boleh ditambah.
	if err := ch.Qos(10, 0, false); err != nil {
		return err
	}

	deliveries, err := ch.Consume(q.Name, "", false, false, false, false, nil)
	if err != nil {
		return err
	}
	log.Info("mendengarkan event", "queue", QueueName, "binding", BindingKey)

	for d := range deliveries {
		if ctx.Err() != nil {
			// Sedang berhenti: jangan ACK, biar broker kirim ulang nanti.
			return ctx.Err()
		}
		var ev storeEvent
		if err := json.Unmarshal(d.Body, &ev); err != nil {
			// Pesan rusak: ACK agar tidak berputar selamanya, tetapi
			// dicatat lengkap dengan pengenal pesan broker (delivery tag).
			log.Warn("pesan rusak — dibuang", "delivery_tag", d.DeliveryTag, "galat", err)
			d.Ack(false)
			continue
		}
		msg := "Pesanan #" + strconv.FormatInt(ev.OrderID, 10) + " untuk " + ev.Customer +
			" (" + ev.Product + " x" + strconv.Itoa(ev.Qty) + ") sudah dikonfirmasi."
		if err := st.Save(ctx, ev.EventID, ev.OrderID, ev.Customer, msg); err != nil {
			if errors.Is(err, store.ErrDuplicate) {
				// Sudah pernah diproses (misal pesan dikirim ulang) → ACK saja.
				log.Info("event duplikat — dilewati",
					"event", BindingKey, "event_id", ev.EventID, "order_id", ev.OrderID)
				d.Ack(false)
				continue
			}
			// Galat database nyata: NACK tanpa requeue agar tidak loop,
			// tapi pesan sudah dicatat broker untuk ditinjau.
			log.Error("gagal menyimpan notifikasi",
				"event_id", ev.EventID, "order_id", ev.OrderID, "galat", err)
			d.Nack(false, false)
			continue
		}
		d.Ack(false)
		log.Info("notifikasi tersimpan",
			"event", BindingKey, "event_id", ev.EventID, "order_id", ev.OrderID)
	}
	return errors.New("aliran pesan berakhir")
}
