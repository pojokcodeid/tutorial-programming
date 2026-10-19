/* ============================================================
   Pelajaran Microservices — Bab 7: Komunikasi Antar-Service
   ============================================================ */
'use strict';

window.MICROSERVICE_LESSONS = window.MICROSERVICE_LESSONS || [];

window.MICROSERVICE_LESSONS.push({
  id: 'komunikasi-antar-service',
  title: 'Komunikasi Antar-Service: HTTP, Retry, dan Circuit Breaker',
  chapter: 'Arsitektur Microservices',
  duration: '16–18 menit',
  intro: [
    'order-service memvalidasi produk dengan memanggil <code>GET /products/{id}</code> pada catalog-service di port 8081. Di permukaan ini terdengar sederhana, tetapi di jaringan yang sesungguhnya ada empat musuh menanti: koneksi yang menggantung tanpa batas, kegagalan sesaat yang menular, server yang sudah sakit tetap terus dipanggil, dan request yang mengulang sehingga pesanan jadi dobel.',
    'Bab ini membangun client HTTP yang benar untuk Go: <code>http.Client</code> dengan timeout, context propagation dari handler sampai ke downstream, retry dengan exponential backoff dan jitter, circuit breaker dengan <code>gobreaker</code>, idempotency lewat header <code>Idempotency-Key</code>, serta propagasi <code>X-Request-ID</code> agar satu request bisa ditelusuri lintas service. Di akhir bab kamu juga mengenal kapan beralih ke gRPC dengan Protocol Buffers, bagaimana contract test menjaga kontrak tidak dilanggar, dan apa yang terjadi saat catalog-service mati di tengah jalan.'
  ],
  objectives: [
    'Menulis HTTP client Go dengan timeout yang tepat',
    'Menerapkan context propagation dan timeout budget dari handler ke downstream',
    'Menambahkan retry dengan exponential backoff dan jitter tanpa memicu retry storm',
    'Memakai circuit breaker (gobreaker) untuk melindungi service yang sedang sakit',
    'Menerapkan Idempotency-Key dan X-Request-ID pada alur order-service'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>HTTP Client yang Tidak Menggantung Selamanya</h3><p>Bawaan Go menjebak pemula: <code>http.Get</code> memakai client default tanpa timeout, sehingga bila catalog-service menerima koneksi tetapi tidak pernah membalas, goroutine pemanggil akan menggantung selamanya dan koneksi di pool menumpuk hingga order-service kehabisan. Solusinya sederhana: buat <code>http.Client</code> sendiri dengan <code>Timeout</code> yang mencakup seluruh siklus request — mengirim, menunggu, membaca body sampai tuntas.</p><p>Perhatikan juga dua detail yang sering terlewat: body respons wajib ditutup dengan <code>defer resp.Body.Close()</code> agar koneksi bisa dipakai ulang, dan body dibaca melalui <code>io.LimitReader</code> agar satu respons nakal tidak menghabiskan memori. Untuk skala produksi, sesuaikan juga <code>http.Transport</code>: <code>MaxIdleConnsPerHost</code> yang kecil akan memutus-mutus koneksi ke catalog di bawah beban tinggi.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: CatalogClient Lengkap dengan Penanganan 404 dan 5xx',
      lang: 'go',
      output: false,
      code: `package client

import (
    "context"
    "encoding/json"
    "errors"
    "fmt"
    "io"
    "net/http"
    "time"
)

var (
    ErrProductNotFound    = errors.New("produk tidak ditemukan")
    ErrCatalogUnavailable = errors.New("catalog-service tidak tersedia")
)
type CatalogClient struct {
    baseURL string
    http    *http.Client
}

func NewCatalogClient(baseURL string) *CatalogClient {
    return &CatalogClient{baseURL, &http.Client{Timeout: 2 * time.Second}}
}

type Product struct {
    ID    int64  \`json:"id"\`
    Name  string \`json:"name"\`
    Price int64  \`json:"price"\`
}

func (c *CatalogClient) GetProduct(ctx context.Context, id int64) (Product, error) {
    url := fmt.Sprintf("%s/products/%d", c.baseURL, id)
    req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
    if err != nil {
        return Product{}, fmt.Errorf("buat request: %w", err)
    }
    if rid, ok := ctx.Value(reqIDKey).(string); ok {
        req.Header.Set("X-Request-ID", rid)
    }
    resp, err := c.http.Do(req)
    if err != nil {
        return Product{}, fmt.Errorf("%w: %v", ErrCatalogUnavailable, err)
    }
    defer resp.Body.Close()
    switch {
    case resp.StatusCode == http.StatusOK:
        var p Product
        err := json.NewDecoder(io.LimitReader(resp.Body, 1<<20)).Decode(&p)
        if err != nil {
            return Product{}, fmt.Errorf("decode produk: %w", err)
        }
        return p, nil
    case resp.StatusCode == http.StatusNotFound:
        return Product{}, ErrProductNotFound
    default:
        return Product{}, fmt.Errorf("%w: status %d", ErrCatalogUnavailable, resp.StatusCode)
    }
}`,
      explain: [
        '<code>http.NewRequestWithContext</code> menempelkan context ke request; bila klien membatalkan atau timeout, socket langsung dibatalkan oleh runtime.',
        'Status dibedakan: 404 diterjemahkan ke <code>ErrProductNotFound</code> (masalah data, jangan di-retry), sedangkan 5xx dan error jaringan ke <code>ErrCatalogUnavailable</code> (kandidat retry dan circuit breaker); error dibungkus <code>%w</code> agar bisa diperiksa dengan <code>errors.Is</code>.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Context Propagation dan Timeout Budget</h3><p>Handler HTTP di order-service menerima <code>r.Context()</code> yang otomatis terbatalkan saat klien menutup koneksi. Context ini harus <b>diteruskan</b> ke setiap panggilan downstream — bukan diganti dengan <code>context.Background()</code>, karena penggantian itu memutus tali pembatalan: user sudah menekan batal, tetapi order-service tetap menunggu catalog sampai timeout penuh.</p><p>Untuk menambah timeout yang lebih ketat di lapisan pemanggil, bungkus dengan <code>context.WithTimeout</code>. Inilah penerapan timeout budget end-to-end: gateway memberi anggaran 5 detik, order-service memakai 2 detik untuk memanggil catalog, sehingga masih tersisa waktu menulis respons error ke klien. Selalu <code>defer cancel()</code> agar context tidak bocor.</p><p>Satu lagi pengikat antar service: <b>X-Request-ID</b>. Gateway membuat ID unik per request, middleware order-service membacanya (atau membuat baru bila kosong), menyimpannya ke context, meneruskannya ke catalog-service, dan menaruhnya di setiap baris log serta response header. Tanpa pengenal bersama ini, menyelidiki satu kejadian berarti membuka log dua service lalu menebak-nebak; dengan itu, satu ID menarik seluruh jejaknya — fondasi yang nantinya berkembang menjadi distributed tracing dengan OpenTelemetry.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Handler Order-Service dengan Timeout Budget 2 Detik',
      lang: 'go',
      output: false,
      code: `func (h *OrderHandler) CreateOrder(w http.ResponseWriter, r *http.Request) {
    ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
    defer cancel()
    var req CreateOrderRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        writeError(w, http.StatusBadRequest, "body bukan JSON valid")
        return
    }
    product, err := h.catalog.GetProduct(ctx, req.ProductID)
    if errors.Is(err, client.ErrProductNotFound) {
        writeError(w, http.StatusUnprocessableEntity, "produk tidak ada")
        return
    }
    if errors.Is(err, client.ErrCatalogUnavailable) {
        slog.Error("catalog tidak bisa dihubungi", "error", err,
            "request_id", requestID.FromContext(r.Context()))
        writeError(w, http.StatusBadGateway, "layanan produk sedang ganggu")
        return
    }
    if err != nil {
        writeError(w, http.StatusInternalServerError, "gagal memvalidasi produk")
        return
    }
    _ = product // product.Price dipakai sebagai snapshot harga pada order.
}`,
      explain: [
        'Timeout 2 detik adalah anggaran milik lapisan ini; bila gateway sudah memberi 5 detik, angka 2 detik membuat sisa anggaran tetap cukup untuk menulis respons 502.',
        'Pemetaan error dibedakan tajam: data tidak ada = 422 (klien mengoreksi), downstream ganggu = 502 (server bermasalah), sisanya = 500; request ID dari context ikut dicatat agar kejadian bisa dicari di dua service.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Retry dengan Exponential Backoff dan Jitter</h3><p>Kegagalan sesaat — paket hilang, pod baru mulai, GC sejenak — sering membaik dengan sendirinya dalam hitungan ratusan milidetik. <b>Exponential backoff</b> menunggu <code>base * 2^n</code> antar percobaan: 200 ms, 400 ms, 800 ms, dan seterusnya, dibatasi jumlah percobaan. <b>Jitter</b> menambahkan komponen acak pada tiap jeda sehingga pemanggil yang gagal bersamaan tidak bangun pada milidetik yang sama.</p><p>Tanpa jitter, kamu mendapat <b>retry storm</b>: seribu request yang gagal bersamaan menunggu 200 ms lalu menyerang catalog serentak di detik berikutnya — memperpanjang pemulihan yang justru ingin kamu percepat. Terapkan juga dua aturan disiplin: retry hanya untuk kegagalan sementara (error jaringan dan 5xx), tidak pernah untuk 4xx, dan selalu berhenti bila context sudah batal atau budget habis.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Fungsi Retry Generik dengan Backoff dan Jitter',
      lang: 'go',
      output: false,
      code: `package retry

import (
    "context"
    "fmt"
    "math/rand/v2"
    "time"
)

// Do menjalankan fn hingga berhasil, maximal attempts kali.
func Do(ctx context.Context, attempts int, base time.Duration, fn func(ctx context.Context) error) error {
    var err error
    for i := range attempts {
        if err = fn(ctx); err == nil {
            return nil
        }
        if ctx.Err() != nil {
            return ctx.Err() // budget habis atau klien batal: jangan lanjut
        }
        delay := base * time.Duration(1<<i) // base * 2^i
        half := delay / 2
        select {
        case <-time.After(half + time.Duration(rand.Int64N(int64(half)))):
        case <-ctx.Done():
            return ctx.Err()
        }
    }
    return fmt.Errorf("gagal setelah %d percobaan: %w", attempts, err)
}`,
      explain: [
        'Bentuk <code>for i := range attempts</code> adalah idiom Go 1.22+ untuk loop numerik; basis <code>time.Duration(1&lt;&lt;i)</code> menghasilkan pertumbuhan eksponensial, lalu <code>rand.Int64N</code> menambah jitter 0-50% tanpa pustaka luar.',
        'Select terhadap <code>ctx.Done()</code> memastikan retry tidak pernah melampaui timeout budget; inilah bedanya retry yang sopan dengan retry yang rakus.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Circuit Breaker: Berhenti Memanggil yang Sudah Sakit</h3><p>Bayangkan catalog-service sedang tenggelam dalam beban. Retry di setiap order hanya menambah tekanan kepadanya, dan antrean order-service sendiri menumpuk menunggu timeout. <b>Circuit breaker</b> memutus rantai itu dengan tiga keadaan: <b>closed</b> (lancar, semua request lewat), <b>open</b> (gagal terlalu banyak, request langsung ditolak tanpa menyentuh jaringan), dan <b>half-open</b> (setelah jeda, izinkan beberapa percobaan; bila berhasil semua, kembali closed).</p><p>Dampaknya dua arah: downstream mendapat napas untuk pulih, sementara upstream langsung menjawab cepat sehingga tidak menumpuk thread dan koneksi yang menggantung. Nilai ambangnya harus dari data: misalnya trip bila dari 20 request terakhir gagal lebih dari 50%.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Circuit Breaker dengan gobreaker',
      lang: 'go',
      output: false,
      code: `import "github.com/sony/gobreaker"

var breaker = gobreaker.NewCircuitBreaker(gobreaker.Settings{
    Name:        "catalog-service",
    MaxRequests: 3,                 // percobaan saat half-open
    Interval:    10 * time.Second,  // jendela reset hitungan gagal
    Timeout:     30 * time.Second,  // open sebelum kembali half-open
    ReadyToTrip: func(c gobreaker.Counts) bool {
        failureRatio := float64(c.TotalFailures) / float64(c.Requests)
        return c.Requests >= 20 && failureRatio > 0.5
    },
})

func (c *CatalogClient) getProductGuarded(ctx context.Context, id int64) (Product, error) {
    out, err := breaker.Execute(func() (any, error) {
        return c.GetProduct(ctx, id)
    })
    if err != nil {
        return Product{}, err // termasuk gobreaker.ErrOpenState
    }
    return out.(Product), nil
}`,
      explain: [
        'Saat breaker open, <code>Execute</code> mengembalikan <code>gobreaker.ErrOpenState</code> seketika — order-service bisa langsung menjawab 502 tanpa menunggu timeout dua detik.',
        '<code>ReadyToTrip</code> berbasis rasio mencegah trip karena satu kegagalan; minimal 20 request dulu dihitung, dan breaker dipasang per downstream.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Idempotency: Request Duplikat Boleh, Efek Dobel Tidak</h3><p>Klien mobile yang sinyalnya buruk bisa mengirim POST /orders yang sama dua kali; retry otomatis juga bisa menggandakan request. Jawabannya adalah header <code>Idempotency-Key</code>: klien membuat kunci unik (misalnya UUID) untuk satu niat transaksi, dan order-service menyimpan kunci itu dengan <b>unique constraint</b> di database. Percobaan kedua dengan kunci yang sama tidak membuat order baru, melainkan mengembalikan hasil percobaan pertama.</p><pre><code>CREATE TABLE idempotency_keys (\n    key         TEXT PRIMARY KEY,   -- menjamin kunci unik\n    order_id    BIGINT NOT NULL,\n    status_code INT    NOT NULL,\n    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()\n);</code></pre><p>Kekuatan pola ini ada pada constraint-nya: dua request paralel yang mencoba INSERT kunci yang sama di transaksi yang sama dengan pembuatan order — hanya satu yang berhasil, yang kalah langsung menerima respons hasil pemenang yang tersimpan di order_id dan status_code. Tidak ada race condition yang perlu dijaga dengan lock manual. Kunci kadaluarsa dibersihkan berkala berdasarkan created_at agar tabel tidak tumbuh tanpa batas.</p>'
    },
    {
      type: 'text',
      html: '<h3>gRPC, Protocol Buffers, dan Contract Testing</h3><p>REST/JSON sederhana dan mudah didebug, tetapi pembungkus JSON berulang di setiap pesan memboroskan CPU dan lebar pita pada panggilan internal yang volume-nya tinggi. <b>gRPC</b> dengan <b>Protocol Buffers</b> menawarkan alternatif: kontrak .proto menjadi sumber kebenaran, kode stub dihasilkan otomatis untuk client dan server, payload dibinarkan, dan HTTP/2 memberi multiplexing serta streaming. Contoh kontraknya untuk catalog-service:</p><pre><code>syntax = "proto3";\n\npackage oms.catalog.v1;\n\nservice CatalogService {\n  rpc GetProduct(GetProductRequest) returns (Product);\n}\n\nmessage Product {\n  int64  id    = 1;\n  string name  = 2;\n  int64  price = 3;\n  int32  stock = 4;\n}</code></pre><p>Nomor urut field adalah wire identifier yang harus stabil; menambah field baru memakai nomor kosong berikutnya, dan versi package <code>oms.catalog.v1</code> memudahkan perubahan inkompatibel dengan membuat v2 berdampingan. Untuk OMS dengan tiga service dan trafik moderat, REST tetap pilihan yang masuk akal; gRPC mulai terbayar pada panggilan internal berfrekuensi sangat tinggi atau yang butuh streaming.</p><p><b>Contract testing</b> menjaga kontrak (REST maupun proto) tidak dilanggar diam-diam: konsumen menguji ekspektasinya terhadap skema yang dipublikasikan provider — di CI catalog-service menguji bahwa responsnya masih memenuhi fixture milik order-service. Bedakan dari end-to-end test: contract test cepat dan berjalan per service, sedangkan end-to-end test membutuhkan seluruh stack hidup.</p>'
    },
    {
      type: 'tip',
      title: 'Urutan Pertahanan yang Efektif',
      text: 'Susun pertahanan berlapis dengan urutan yang jelas: timeout sebagai pagar paling luar, retry terbatas hanya untuk kegagalan sementara, lalu circuit breaker yang mencegah pemanggilan saat downstream memang sedang sakit. Ketiganya saling melengkapi — timeout tanpa retry membuat sistem rapuh terhadap kegagalan sesaat, retry tanpa breaker memperparah service yang sedang tenggelam, dan keduanya tanpa timeout akan menggantung selamanya.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Simulasikan catalog-service tidak tersedia sejak hari pertama: matikan prosesnya lalu kirim POST /orders. Yang kamu lihat seharusnya respons cepat 502 dari order-service, bukan request yang menggantung dua detik lalu 500, dan tentu bukan antrean yang menumpuk. Uji juga skenario catalog bangkit kembali: circuit breaker harus kembali closed dengan sendirinya tanpa restart order-service. Sistem yang tidak pernah diuji dalam kondisi rusak bukan sistem yang tangguh — hanya sistem yang belum ketahuan rapuhnya.'
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Turunkan <code>Timeout</code> CatalogClient ke 50 ms, matikan catalog-service, lalu ukur berapa lama order-service menjawab. Naikkan lagi dan bandingkan.</li><li>Tambahkan tiga kali retry berbasis fungsi retry pada pemanggilan GetProduct, tetapi hanya untuk <code>ErrCatalogUnavailable</code> — 404 tidak boleh di-retry.</li><li>Pasang middleware yang membaca atau membuat X-Request-ID, simpan ke context, lalu pastikan nilainya muncul di log order-service dan di header request menuju catalog-service.</li><li>Tulis contract test sederhana: pastikan respons GET /products/{id} selalu memiliki field id, name, dan price bertipe yang benar.</li></ol>'
    },
    {
      type: 'vocab',
      items: [
        ['http.Client dengan Timeout', 'Client khusus yang membatasi total waktu siklus request; mencegah koneksi menggantung selamanya.'],
        ['Context propagation', 'Penyerapan context dari handler ke panggilan downstream agar pembatalan dan timeout ikut mengalir.'],
        ['Timeout budget', 'Anggaran waktu total yang dibagi dari tepi ke inti rantai panggilan; selalu menyusut, tidak pernah melebar.'],
        ['Exponential backoff', 'Jeda antar retry yang mengganda tiap percobaan untuk memberi downstream waktu pulih.'],
        ['Jitter', 'Komponen acak pada jeda retry yang mencegah banyak pemanggil menyerang serentak.'],
        ['Retry storm', 'Serangan retry serentak yang memperparah downstream yang sedang sekarat.'],
        ['Circuit breaker', 'Pemutus sirkuit tiga keadaan (closed, open, half-open) yang menghentikan pemanggilan ke downstream yang sakit.'],
        ['Idempotency-Key', 'Header berisi kunci unik per niat transaksi; duplikatnya ditolak oleh unique constraint di database.'],
        ['X-Request-ID', 'Header pengenal request yang diteruskan lintas service agar bisa dicari di semua log.']
      ]
    }
  ],
  recap: [
    'Selalu buat http.Client sendiri dengan Timeout; http.Get tanpa timeout adalah jebakan bawaan Go yang membuat koneksi menggantung selamanya.',
    'Teruskan r.Context() ke downstream dan bungkus dengan WithTimeout untuk timeout budget; petakan 404 ke 422 dan kegagalan downstream ke 502.',
    'Retry memakai exponential backoff plus jitter dengan batas percobaan; tanpa itu kamu memicu retry storm, dan circuit breaker melindungi downstream yang sedang sakit.',
    'Idempotency-Key dengan unique constraint membuat request duplikat aman; X-Request-ID membuat satu kejadian bisa ditelusuri lintas service.',
    'gRPC dan Protocol Buffers layak dipertimbangkan untuk panggilan internal berfrekuensi tinggi; contract test menjaga kontrak tetap dilanggar.'
  ]
});
