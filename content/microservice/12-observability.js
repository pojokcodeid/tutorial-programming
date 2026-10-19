/* ============================================================
   Pelajaran Microservices — Bab 12: Observability dengan Grafana
   ============================================================ */
'use strict';

window.MICROSERVICE_LESSONS = window.MICROSERVICE_LESSONS || [];

window.MICROSERVICE_LESSONS.push({
  id: 'observability-grafana',
  title: 'Observability: Logs, Metrics & Traces dengan Prometheus dan Grafana',
  chapter: 'Infrastruktur & Observabilitas',
  duration: '14–16 menit',
  intro: [
    'Di monolith, menemukan masalah relatif mudah: satu proses, satu log, satu titik melambat. Di microservices, satu pesanan melewati order-service, catalog-service, RabbitMQ, dan notification-service — dan kegagalan bisa terjadi di mana saja di antaranya. Kamu tidak bisa lagi menebak; kamu harus <b>mengukur dan menelusuri</b>.',
    '<b>Observability</b> adalah kemampuan menjawab pertanyaan tak terduga tentang sistem dari data yang sudah dikumpulkan, tanpa harus menambah kode baru. Ia bertumpu pada tiga pilar: <b>logs</b> (peristiwa detail per request), <b>metrics</b> (angka agregat untuk tren dan alerting), dan <b>traces</b> (perjalanan satu request lintas service). Ketiganya saling melengkapi, dan kuncinya adalah satu penghubung: request ID dan trace ID.',
    'Bab ini menginstrumenkan OMS secara utuh: structured logging dengan slog, histogram durasi request untuk Prometheus, dashboard RED di Grafana, dan distributed tracing OpenTelemetry yang menelusuri order-service sampai ke catalog-service.'
  ],
  objectives: [
    'Menjelaskan peran logs, metrics, dan traces serta metode RED dan USE',
    'Menulis structured logging dengan slog yang membawa request ID dan trace ID',
    'Mengekspos metrik counter dan histogram lewat endpoint /metrics Prometheus',
    'Membaca PromQL untuk request rate, error rate, dan persentil p95',
    'Menerapkan OpenTelemetry tracer dengan propagasi trace context W3C'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Tiga Pilar Observability</h3><ul><li><b>Logs</b> — catatan per peristiwa, kaya detail, bervolume besar. Jawaban untuk pertanyaan <i>mengapa</i>: mengapa order ini gagal? Karena catalog-service membalas 503 tiga kali.</li><li><b>Metrics</b> — angka numerik yang di-agregasi seiring waktu, murah disimpan, ideal untuk grafik dan alert. Jawaban untuk pertanyaan <i>kapan dan berapa</i>: sejak 14:05 p95 melonjak ke 2 detik.</li><li><b>Traces</b> — perjalanan satu request melewati banyak service, dengan durasi tiap span. Jawaban untuk pertanyaan <i>di mana</i>: 80% waktu habis di query database catalog.</li></ul><p>Standar emas korelasi: setiap log menyertakan <code>request_id</code> dan <code>trace_id</code>, sehingga dari satu trace di Grafana kamu bisa melompat ke log yang persis relevan, dan sebaliknya.</p><h3>Structured Logging dengan slog</h3><p>Go 1.21 menghadirkan <code>log/slog</code> di standar library: log berupa JSON terstruktur (bukan teks bebas), sehingga mesin bisa memfilter dan mengindeksnya. Middleware berikut melengkapi tiap request dengan request ID dan trace ID dari konteks OpenTelemetry.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Middleware Logging dengan Request ID dan Trace ID',
      lang: 'go',
      output: false,
      code: `type statusRecorder struct {
    http.ResponseWriter
    status int
}
func (r *statusRecorder) WriteHeader(code int) {
    r.status = code
    r.ResponseWriter.WriteHeader(code)
}

func Logging(service string) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            start := time.Now()
            rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
            next.ServeHTTP(rec, r)
            spanCtx := trace.SpanFromContext(r.Context()).SpanContext()
            slog.Info("http request selesai",
                "service", service,
                "method", r.Method,
                "path", r.URL.Path,
                "status", rec.status,
                "duration_ms", time.Since(start).Milliseconds(),
                "request_id", r.Header.Get("X-Request-ID"),
                "trace_id", spanCtx.TraceID().String(),
            )
        })
    }
}`,
      explain: [
        'Output slog.Info dengan variadic key-value menghasilkan JSON seperti <code>{"time":"...","level":"INFO","msg":"http request selesai","service":"order",...}</code> — setiap field menjadi kolom yang bisa difilter di sistem log (Loki, ELK). <code>statusRecorder</code> menyisipkan diri untuk merekam status code tanpa mengubah perilaku handler; tanpa ini semua log tercatat 200.',
        '<code>trace_id</code> diambil dari konteks; ketika trace aktif, kamu bisa mencari seluruh log sepanjang satu perjalanan request hanya dengan ID itu.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Jenis Metrik dan Metode RED serta USE</h3><p>Prometheus mengenal tiga bentuk metrik, masing-masing untuk pertanyaan berbeda:</p><ul><li><b>Counter</b> — jumlah kumulatif yang hanya naik: total request, total error, total order dibuat. Berguna untuk laju (rate) via fungsi <code>rate()</code>.</li><li><b>Histogram</b> — distribusi durasi atau ukuran yang dibucket-kan (mis. &lt;10ms, &lt;50ms, &lt;100ms). Satu-satunya cara jujur menghitung persentil seperti p95.</li><li><b>Gauge</b> — nilai yang naik-turun: ukuran antrian RabbitMQ, jumlah koneksi database aktif, suhu CPU.</li></ul><p>Dua metode membantu memilih apa yang harus diukur: <b>RED</b> (Rate, Errors, Durasi) melihat layanan dari sudut pandang pengguna — berapa request, berapa yang gagal, berapa lama responsnya. <b>USE</b> (Utilization, Saturation, Errors) melihat dari sudut pandang sumber daya — seberapa penuh CPU, seberapa dalam antrian menunggu, berapa error. Untuk setiap service OMS, RED dipasang pada endpoint <code>/metrics</code>; USE dilaporkan node exporter dan exporter database.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Instrumen Prometheus — Counter dan Histogram Durasi',
      lang: 'go',
      output: false,
      code: `var (
    httpRequests = promauto.NewCounterVec(prometheus.CounterOpts{
        Name: "http_requests_total",
        Help: "Jumlah request HTTP yang sudah dilayani.",
    }, []string{"service", "route", "status"})
    httpDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
        Name:    "http_request_duration_seconds",
        Help:    "Durasi request HTTP dalam detik.",
        Buckets: []float64{0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5},
    }, []string{"service", "route", "status"})
)

func Metrics(service string) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            start := time.Now()
            rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
            next.ServeHTTP(rec, r)
            // r.Pattern = pola rute (mis. "GET /products/{id}"),
            // bukan path mentah — kunci agar label tetap rendah kardinalitasnya
            route := r.Pattern
            if route == "" {
                route = "unmatched"
            }
            status := strconv.Itoa(rec.status)
            httpRequests.WithLabelValues(service, route, status).Inc()
            httpDuration.WithLabelValues(service, route, status).
                Observe(time.Since(start).Seconds())
        })
    }
}`,
      explain: [
        'Pustaka resmi <code>github.com/prometheus/client_golang</code> menyediakan <code>promauto</code> untuk mendaftarkan metrik otomatis; hasilnya disajikan oleh <code>promhttp.Handler()</code> yang dipasang pada rute <code>GET /metrics</code>.',
        'Label <code>route</code> memakai pola rute Go 1.22 (<code>r.Pattern</code>) sehingga <code>/products/1</code> dan <code>/products/999</code> jatuh ke label yang sama. Inilah pembeda antara metrik yang sehat dan metrik yang meledak.',
        'Bucket histogram dipilih di sekitar SLO: dengan bucket 0.25 dan 0.5, perhitungan p95 akurat di rentang 500 ms yang jadi target layanan.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh: Konfigurasi Scraping Prometheus',
      lang: 'yaml',
      output: false,
      code: `# prometheus.yml
scrape_configs:
  - job_name: oms
    scrape_interval: 15s
    static_configs:
      - targets:
          - catalog:8081
          - order:8082
          - notification:8083
        labels:
          stack: oms-dev

  - job_name: node
    static_configs:
      - targets: ["node-exporter:9100"]`,
      explain: [
        'Prometheus menarik (pull) data dari endpoint <code>/metrics</code> tiap 15 detik — karena itu target harus dapat dijangkau dari host Prometheus, bukan sebaliknya; di Compose, cukup berada di satu network.',
        'Label <code>stack: oms-dev</code> menempel pada semua metrik job ini, memungkinkan perbandingan antarlingkungan dalam satu dashboard.',
        'Setiap job menambahkan label <code>job</code> dan <code>instance</code> otomatis — berguna untuk memecah metrik per service instance.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Grafana dan PromQL</h3><p>Grafana adalah lapisan visualisasi di atas Prometheus: buat datasource Prometheus sekali, lalu susun panel-panel RED — request rate, error rate, dan latensi p95 — dalam satu dashboard per service. Tiga ekspresi PromQL berikut adalah perangkat harian kamu:</p>'
    },
    {
      type: 'example',
      title: 'Contoh: PromQL untuk Dashboard RED',
      lang: 'text',
      output: false,
      code: `# Request rate per detik, dikelompokkan per route
sum by (route) (rate(http_requests_total{service="catalog"}[5m]))

# Error rate: rasio request 5xx terhadap seluruh request
sum(rate(http_requests_total{service="catalog",status=~"5.."}[5m]))
  /
sum(rate(http_requests_total{service="catalog"}[5m]))

# p95 latency dari histogram, per route
histogram_quantile(0.95,
  sum by (le, route) (rate(http_request_duration_seconds_bucket{service="catalog"}[5m])))`,
      explain: [
        'Fungsi <code>rate()</code> menghitung laju per detik dari counter kumulatif pada jendela waktu 5 menit — jendela lebih lebar membuat grafik stabil, lebih sempit membuatnya responsif.',
        '<code>histogram_quantile</code> membutuhkan agregasi <code>by (le, route)</code>: kolom <code>le</code> adalah batas bucket histogram dan wajib ikut dikelompokkan agar persentilnya benar.',
        'Jalur error rate memakai <code>status=~"5.."</code> (regex) untuk menyaring server error; ubah ke <code>4..</code> bila ingin mengamati kesalahan klien seperti 401 dan 429.'
      ]
    },
    {
      type: 'text',
      html: '<h3>OpenTelemetry: Distributed Tracing</h3><p><b>OpenTelemetry</b> adalah standar terbuka untuk telemetry; untuk tracing, ia menghasilkan <b>span</b> — satu unit kerja dengan nama, durasi, dan atribut. Satu request yang melewati beberapa service membentuk satu <b>trace</b> yang terhubung melalui header <b>W3C Trace Context</b>: <code>traceparent</code> berisi trace ID dan span ID aktif, dikirim otomatis oleh transport HTTP yang sudah diinstrumentasi.</p><p>Di OMS, order-service memulai trace saat menerima POST /orders; ketika memvalidasi produk ke catalog-service, transport <code>otelhttp</code> menyisipkan <code>traceparent</code> ke header; catalog-service yang membaca header yang sama otomatis menjadi bagian trace yang sama. Hasilnya: satu tampilan grafis yang menunjukkan waktu habis di service mana.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Tracer OpenTelemetry dan Propagasi ke catalog-service',
      lang: 'go',
      output: false,
      code: `func initTracer(ctx context.Context) (*sdktrace.TracerProvider, error) {
    exporter, err := otlptracegrpc.New(ctx,
        otlptracegrpc.WithEndpoint("otel-collector:4317"),
        otlptracegrpc.WithInsecure(), // TLS diatur terpisah untuk produksi
    )
    if err != nil {
        return nil, err
    }
    tp := sdktrace.NewTracerProvider(
        sdktrace.WithBatcher(exporter),
        sdktrace.WithResource(resource.NewWithAttributes(
            semconv.SchemaURL,
            semconv.ServiceName("order-service"),
        )),
    )
    // Propagator W3C: membaca dan menulis header traceparent
    otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
        propagation.TraceContext{}, propagation.Baggage{},
    ))
    otel.SetTracerProvider(tp)
    return tp, nil
}

// HTTP client yang otomatis menyisipkan traceparent ke tiap request:
catalogClient := &http.Client{
    Timeout:   2 * time.Second,
    Transport: otelhttp.NewTransport(http.DefaultTransport),
}

// Di dalam handler CreateOrder:
func (h *Handler) CreateOrder(w http.ResponseWriter, r *http.Request) {
    ctx, span := h.tracer.Start(r.Context(), "order.validate-products")
    defer span.End()
    req, _ := http.NewRequestWithContext(ctx, http.MethodGet,
        h.catalogURL+"/products/"+productID, nil)
    resp, err := h.catalogClient.Do(req) // traceparent terkirim otomatis
    if err != nil {
        span.SetAttributes(attribute.Bool("error", true))
        http.Error(w, \`{"error":"catalog tidak terjangkau"}\`, http.StatusBadGateway)
        return
    }
    defer resp.Body.Close()
    span.SetAttributes(attribute.Int("catalog.status", resp.StatusCode))
}`,
      explain: [
        '<code>r.Context()</code> adalah jembatannya: span dibuat dari konteks request, lalu konteks itu diteruskan ke <code>NewRequestWithContext</code> sehingga panggilan ke catalog-service terhubung pada trace yang sama.',
        '<code>otelhttp.NewTransport</code> menangani dua sekaligus: membuat span client untuk tiap panggilan keluar dan menyisipkan header <code>traceparent</code> (W3C Trace Context) secara otomatis.',
        'Exporter mengirim span lewat OTLP gRPC ke collector OpenTelemetry, yang meneruskannya ke backend seperti Jaeger atau Tempo — di Compose cukup tambahkan satu service collector.'
      ]
    },
    {
      type: 'warn',
      title: 'Perhatian: Cardinality pada Label Metrik',
      text: 'Jangan pernah memakai ID unik — user ID, order ID, email, atau path mentah berisi ID — sebagai label metrik. Setiap kombinasi label adalah satu seri time series yang disimpan Prometheus selamanya; label order ID pada ribuan order membuat Prometheus menghabiskan memori dan membuat query melambat. Gunakan pola rute sebagai label, dan simpan ID unik sebagai field di log atau atribut span — tempat yang memang dirancang untuk keunikan.'
    },
    {
      type: 'text',
      html: '<h3>Alerting, SLO, dan Error Budget</h3><p>Dashboard menunggu kamu membukanya; <b>alert</b> datang ke kamu. Prometheus menyimpan aturan alert yang dievaluasi berkala, lalu meneruskannya ke Alertmanager untuk dikirim ke Slack atau halaman on-call. Contoh aturan yang menjaga SLO p95 catalog-service di bawah 500 ms:</p><pre><code>groups:\n  - name: oms-slo\n    rules:\n      - alert: CatalogP95DiAtasSLO\n        expr: |\n          histogram_quantile(0.95,\n            sum by (le) (rate(http_request_duration_seconds_bucket{service="catalog"}[5m]))) > 0.5\n        for: 10m\n        labels:\n          severity: warning\n        annotations:\n          summary: "p95 catalog-service di atas 500 ms selama 10 menit"</code></pre><p>Dua kunci yang membuat alert sehat: <code>for: 10m</code> menahan alert sampai pelanggaran bertahan lama (mencegah false alarm dari lonjakan sesaat), dan setiap alert harus ditindaklanjuti dengan <b>error budget</b> — kuota "waktu boleh gagal" yang diperbolehkan oleh SLO. Bila p95 500 ms berarti maksimal 0,17% waktu gagal dalam sebulan, maka setiap insiden menghabiskan anggaran itu; saat anggaran habis, fokus tim beralih dari fitur baru ke perbaikan keandalan.</p>'
    },
    {
      type: 'tip',
      title: 'Latihan: Telusuri Latency Tinggi dengan Trace',
      text: 'Tambahkan sengaja latensi pada catalog-service (time.Sleep 800 ms di handler GetProduct, atau naikkan timeout kueri database), lalu lakukan penyelidikan berurutan: buka panel p95 di Grafana sampai terlihat lonjakan, ambil trace ID dari span yang lambat di Tempo/Jaeger, periksa log dengan trace_id yang sama di Loki, lalu tentukan span mana yang menyimpan 800 ms itu. Setelah penyebab ditemukan, kembalikan kodenya dan pastikan grafik p95 kembali normal.'
    },
    {
      type: 'vocab',
      items: [
        ['Structured logging', 'Log berformat JSON terstruktur (slog) yang bisa difilter dan diindeks per field.'],
        ['Counter', 'Metrik kumulatif yang hanya naik; dipakai bersama rate() untuk menghitung laju per detik.'],
        ['Histogram', 'Metrik distribusi berbentuk bucket; satu-satunya dasar perhitungan persentil p95 di Prometheus.'],
        ['Gauge', 'Metrik nilai naik-turun, misalnya kedalaman antrian atau jumlah koneksi aktif.'],
        ['RED method', 'Metrik dari sudut pandang pengguna: Rate, Errors, Duration per service.'],
        ['Trace dan span', 'Trace adalah perjalanan satu request lintas service; span adalah satu tahap kerja di dalamnya.'],
        ['traceparent', 'Header W3C Trace Context yang membawa trace ID dan span ID antar-service.'],
        ['Error budget', 'Kuota kegagalan yang diperbolehkan SLO; habisnya anggaran memicu fokus ke keandalan.']
      ]
    }
  ],
  recap: [
    'Logs menjawab mengapa, metrics menjawab kapan dan berapa, traces menjawab di mana; request ID dan trace ID adalah penghubung ketiganya.',
    'Structured logging dengan slog menghasilkan JSON yang bisa difilter; middleware menyertakan request_id dan trace_id pada setiap baris.',
    'Prometheus mengumpulkan counter, histogram, dan gauge lewat endpoint /metrics; histogram adalah dasar perhitungan p95 dengan histogram_quantile.',
    'Metode RED (Rate, Errors, Duration) menilai service dari sisi pengguna dan menjadi isi baku dashboard Grafana per service.',
    'OpenTelemetry menghubungkan order-service dan catalog-service dalam satu trace lewat header traceparent (W3C); jangan pernah memakai ID unik sebagai label metrik.'
  ]
});
