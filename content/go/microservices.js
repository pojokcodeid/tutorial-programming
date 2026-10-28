/* ============================================================
   Pelajaran Go — Bab 18: Microservices & Distributed Systems
   (topik info.md:
    - "gRPC & Protocol Buffers (protobuf)"
    - "Message Broker integration (RabbitMQ, Apache Kafka, NATS)"
    - "Distributed Tracing (OpenTelemetry) & Centralized Logging (Zap/ZeroLog)")
   ============================================================ */
'use strict';

window.GO_LESSONS = window.GO_LESSONS || [];

/* ---------- Pelajaran 38: gRPC, Message Broker & Observability ---------- */
window.GO_LESSONS.push({
  id: 'microservices',
  title: 'Microservices: gRPC, Message Broker & Observability',
  chapter: 'Microservices',
  duration: '13 menit',
  intro: [
    'Saat aplikasi membesar, satu program monolitik bisa dipecah menjadi beberapa <b>layanan (services)</b> yang berkomunikasi lewat jaringan. Go adalah bahasa favorit untuk dunia <b>microservices</b>.',
    'Pelajaran ini mengenalkan <b>gRPC & Protocol Buffers</b> untuk komunikasi antar layanan, <b>message broker</b> untuk pesan asinkron, serta <b>observability</b> (tracing & logging) agar sistem terdistribusi tetap dapat dipantau.'
  ],
  objectives: [
    'Memahami komunikasi antar layanan dengan gRPC & protobuf',
    'Mengenal peran message broker (RabbitMQ, Kafka, NATS)',
    'Memahami distributed tracing dengan OpenTelemetry',
    'Menerapkan centralized logging dengan Zap/ZeroLog'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>gRPC</b> adalah kerangka komunikasi antar layanan dari Google yang memakai <b>HTTP/2</b> dan <b>Protocol Buffers</b> (protobuf). Alih-alih JSON, pesan dikirim dalam format biner yang ringkas dan cepat. Kontrak API ditulis di berkas <code>.proto</code>, lalu kode klien & server di-<i>generate</i> otomatis.</p>'
    },
    {
      type: 'example',
      title: 'Kontrak gRPC dalam berkas .proto',
      lang: 'go',
      output: false,
      code: `syntax = "proto3";

package pengguna;

option go_package = "app/proto/pengguna";

// Definisi pesan
message PenggunaRequest {
  int32 id = 1;
}

message PenggunaResponse {
  int32 id = 1;
  string nama = 2;
  string email = 3;
}

// Definisi layanan
service PenggunaService {
  rpc AmbilPengguna (PenggunaRequest) returns (PenggunaResponse);
}`,
      explain: [
        'Berkas <code>.proto</code> mendefinisikan pesan (message) dan layanan (service).',
        'Angka <code>= 1</code>, <code>= 2</code> adalah nomor field di format biner — jangan diubah sembarangan.',
        '<code>go_package</code> menentukan lokasi kode Go hasil generate.',
        'Kontrak ini berlaku untuk semua bahasa, memudahkan interoperabilitas.'
      ]
    },
    {
      type: 'example',
      title: 'Menghasilkan kode & server gRPC',
      lang: 'go',
      output: false,
      code: `# Pasang plugin protoc untuk Go
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# Generate kode Go dari .proto
protoc --go_out=. --go-grpc_out=. proto/pengguna.proto

# -----------------------------------------------------------

// Implementasi server
package main

import (
    "context"
    "net"

    "app/proto/pengguna"
    "google.golang.org/grpc"
)

type server struct {
    pengguna.UnimplementedPenggunaServiceServer
}

func (s *server) AmbilPengguna(ctx context.Context, req *pengguna.PenggunaRequest) (*pengguna.PenggunaResponse, error) {
    return &pengguna.PenggunaResponse{Id: req.Id, Nama: "Andi", Email: "andi@mail.com"}, nil
}

func main() {
    lis, _ := net.Listen("tcp", ":50051")
    grpcServer := grpc.NewServer()
    pengguna.RegisterPenggunaServiceServer(grpcServer, &server{})
    grpcServer.Serve(lis)
}`,
      explain: [
        '<code>protoc</code> menghasilkan kode Go dari kontrak .proto.',
        'Server mengimplementasikan interface yang dihasilkan.',
        'Klien memanggil method seolah fungsi lokal, padahal lewat jaringan.',
        'gRPC lebih efisien dari REST/JSON untuk komunikasi internal yang padat.'
      ]
    },
    {
      type: 'text', html: '<p>Untuk komunikasi <b>asinkron</b> — di mana pengirim tidak menunggu balasan — dipakai <b>message broker</b>. Layanan mempublikasikan pesan ke topik/antrean, dan layanan lain mengonsumsinya kapan saja.</p><table class="vocab"><tr><th>Broker</th><th>Karakter</th><th>Kasus khas</th></tr><tr><td>RabbitMQ</td><td>Antrean pesan, routing kompleks</td><td>Pengiriman tugas, notifikasi</td></tr><tr><td>Apache Kafka</td><td>Log terdistribusi, throughput sangat tinggi</td><td>Event streaming, analitik real-time</td></tr><tr><td>NATS</td><td>Ringan, cepat, sederhana</td><td>Pub/sub internal, IoT</td></tr></table>'
    },
    {
      type: 'example',
      title: 'Contoh publishing ke NATS',
      lang: 'go',
      output: false,
      code: `package main

import (
    "log"

    "github.com/nats-io/nats.go"
)

func main() {
    // Sambung ke server NATS
    nc, err := nats.Connect(nats.DefaultURL)
    if err != nil {
        log.Fatal(err)
    }
    defer nc.Close()

    // Berlangganan topik "pesanan.baru"
    nc.Subscribe("pesanan.baru", func(m *nats.Msg) {
        log.Println("pesanan diterima:", string(m.Data))
    })

    // Publikasikan pesan
    nc.Publish("pesanan.baru", []byte("pesanan #1001"))

    // Jaga program tetap hidup
    select {}
}`,
      explain: [
        'Publisher mengirim pesan ke topik; subscriber menerima tanpa terikat langsung.',
        'Pub/sub membuat layanan longgar ikatan dan tahan gagal.',
        'Kafka/RabbitMQ punya API berbeda, tetapi konsepnya serupa.',
        'Gunakan broker saat butuh memisahkan waktu proses pengirim dan penerima.'
      ]
    },
    {
      type: 'text', // observability
      html: '<p>Dalam sistem terdistribusi, satu permintaan bisa melewati banyak layanan. Saat ada masalah, kita butuh <b>observability</b>: <b>tracing</b> untuk melihat jejak perjalanan permintaan, <b>logging</b> terpusat untuk mencatat kejadian, dan <b>metrics</b> untuk memantau kesehatan. Standar modernnya adalah <b>OpenTelemetry</b>.</p>'
    },
    {
      type: 'example',
      title: 'Distributed tracing dengan OpenTelemetry',
      lang: 'go',
      output: false,
      code: `package main

import (
    "context"
    "log"

    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/trace"
)

var tracer trace.Tracer

func main() {
    // Biasanya tracer diambil dari provider yang dikonfigurasi saat startup
    tracer = otel.Tracer("layanan-pengguna")

    ctx := context.Background()
    ctx, span := tracer.Start(ctx, "AmbilPengguna")   // mulai span
    defer span.End()                                   // akhiri span

    // ... logika yang memanggil database, layanan lain, dsb ...
    _ = ctx
    log.Println("selesai")
}`,
      explain: [
        'Sebuah <b>span</b> mewakili satu operasi dalam jejak permintaan.',
        'Span saling terhubung lewat <code>context</code> — jejak yang sama mengalir antar layanan.',
        'Trace dikirim ke backend (Jaeger, Tempo, dsb) untuk divisualisasikan.',
        'OpenTelemetry adalah standar terbuka untuk tracing, metrics, dan logs.'
      ]
    },
    {
      type: 'example',
      title: 'Structured logging dengan zap',
      lang: 'go',
      output: false,
      code: `package main

import "go.uber.org/zap"

func main() {
    // Logger terstruktur (JSON) — mudah dicari di sistem log terpusat
    logger, _ := zap.NewProduction()
    defer logger.Sync()

    logger.Info("pengguna login",
        zap.Int("user_id", 42),
        zap.String("ip", "10.0.0.1"),
    )

    logger.Error("gagal koneksi database",
        zap.String("db", "mysql"),
        zap.Error(nil),
    )
}`,
      explain: [
        '<b>Structured logging</b> menulis log sebagai data (key-value/JSON), bukan teks bebas.',
        'Memudahkan pencarian & analitik di sistem seperti Loki, Elasticsearch, atau Datadog.',
        'Zap dan ZeroLog adalah pilihan populer karena sangat cepat.',
        'Cara pakai lengkapnya — log, log/slog, Zap, ZeroLog, hingga rotasi berkas — dibahas di <b>bab Logging &amp; Observability</b>.',
        'Hindari mencetak log yang tidak terstruktur pada sistem berskala besar.'
      ]
    },
    {
      type: 'tip',
      title: 'Mulai dari monolit, pecah bila perlu',
      text: 'Microservices menyelesaikan masalah skala besar, tetapi menambah kerumitan: jaringan, kegagalan parsial, konsistensi data, dan operasional. Banyak tim justru beruntung memulai dari monolit modular lalu memecahnya ketika benar-benar perlu.'
    },
    {
      type: 'warn',
      title: 'Jaringan selalu bisa gagal',
      text: 'Dalam sistem terdistribusi, kegagalan jaringan adalah hal normal, bukan pengecualian. Terapkan timeout, retry dengan backoff, circuit breaker, dan idempotensi agar layanan tetap andal.'
    },
    {
      type: 'vocab',
      items: [
        ['gRPC', 'Kerangka RPC berkinerja tinggi memakai HTTP/2 dan protobuf.'],
        ['Protocol Buffers', 'Format serialisasi biner dengan kontrak .proto.'],
        ['Message broker', 'Perantara pesan asinkron antar layanan.'],
        ['Pub/Sub', 'Pola publikasi-langganan pesan.'],
        ['Distributed tracing', 'Melacak jejak satu permintaan melintasi banyak layanan.'],
        ['Span', 'Satu unit kerja dalam sebuah trace.'],
        ['OpenTelemetry', 'Standar terbuka untuk tracing, metrics, dan logs.'],
        ['Structured logging', 'Log dalam bentuk data terstruktur (mis. JSON).']
      ]
    }
  ],
  recap: [
    'gRPC memakai HTTP/2 dan protobuf untuk komunikasi antar layanan yang efisien.',
    'Kontrak .proto menghasilkan kode klien & server otomatis.',
    'Message broker (RabbitMQ, Kafka, NATS) menangani komunikasi asinkron.',
    'Distributed tracing (OpenTelemetry) melacak permintaan lintas layanan.',
    'Structured logging dengan zap/zerolog memudahkan pemantauan.',
    'Mulai dari monolit modular; pecah ke microservices hanya bila perlu.'
  ]
});
