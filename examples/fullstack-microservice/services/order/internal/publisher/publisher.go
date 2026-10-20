/*
Package publisher — penerbit event ke RabbitMQ untuk order-service.

Exchange bertipe topic dinamai tokokita.events; routing key "order.created"
dipakai notification-service untuk menyaring pesan yang ia butuhkan.
Pesan ditandai persistent agar broker menyimpannya bila restart.
*/
package publisher

import (
	"context"
	"encoding/json"
	"log"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

const (
	ExchangeName = "tokokita.events"
	RoutingKey   = "order.created"
)

// Event adalah kontrak antar service: apa pun yang membaca exchange ini
// boleh mengandalkan bentuk field di bawah ini.
type Event struct {
	EventID   string    `json:"event_id"`
	OrderID   int64     `json:"order_id"`
	Customer  string    `json:"customer"`
	Product   string    `json:"product"`
	Qty       int       `json:"qty"`
	Total     int       `json:"total"`
	CreatedAt time.Time `json:"created_at"`
}

type Publisher struct {
	ch *amqp.Channel
}

// New menyiapkan channel sekaligus mendeklarasikan exchange (idempoten:
// deklarasi yang sama berkali-kali aman).
func New(conn *amqp.Connection) *Publisher {
	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("gagal membuka channel AMQP: %v", err)
	}
	if err := ch.ExchangeDeclare(ExchangeName, "topic", true, false, false, false, nil); err != nil {
		log.Fatalf("gagal mendeklarasikan exchange: %v", err)
	}
	return &Publisher{ch: ch}
}

// Publish mengirim satu event order.created dengan batas waktu.
func (p *Publisher) Publish(ctx context.Context, ev Event) error {
	body, err := json.Marshal(ev)
	if err != nil {
		return err
	}
	return p.ch.PublishWithContext(ctx, ExchangeName, RoutingKey, false, false, amqp.Publishing{
		ContentType:  "application/json",
		DeliveryMode: amqp.Persistent, // tahan restart broker
		MessageId:    ev.EventID,
		Timestamp:    time.Now(),
		Body:         body,
	})
}
