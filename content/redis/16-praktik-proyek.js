/* ============================================================
   Pelajaran Redis — Bab 16: Proyek Akhir: API Produk yang Cepat dengan Redis
   ============================================================ */
'use strict';

window.REDIS_LESSONS = window.REDIS_LESSONS || [];

window.REDIS_LESSONS.push({
  id: 'praktik-proyek',
  title: 'Proyek Akhir: API Produk yang Cepat dengan Redis',
  chapter: 'Proyek Akhir',
  duration: '14–16 menit',
  intro: [
    'Bayangkan perpustakaan dengan satu buku yang paling sering dipinjam. Bila buku itu selalu diambil dari gudang di lantai bawah, setiap peminjaman memakan waktu berjam-jam; tetapi bila disalin dan diletakkan di meja petugas, pengambilannya jadi hitungan detik. REST API produk bekerja persis seperti itu: halaman detail produk dibaca ribuan kali sementara diubah hanya beberapa kali sehari, dan Redis adalah meja tempat salinan cepat itu diletakkan.',
    'Bab ini merangkum seluruh materi menjadi satu proyek utuh: API produk berteknologi <b>Go</b> dengan <b>MariaDB</b> sebagai sumber kebenaran dan <b>Redis</b> sebagai lapisan kecepatan. Kamu akan membangunnya berurutan mulai dari <i>cache-aside</i> pada pembacaan, pembatalan cache saat penulisan, pelindung laju per API key, daftar blokir token yang sudah logout, sampai health check dan <i>graceful shutdown</i> yang menutup koneksi dengan rapi.',
    'Setelah lima langkah praktik itu, bab ini ditutup dengan checklist rilis produksi yang bisa dicentang satu per satu: keamanan, memori, persistence, ketersediaan, monitoring, backup, dan uji beban. Untuk yang ingin melangkah lebih jauh, tersedia pula singgahan singkat mengenai modul RediSearch dan RedisJSON, jalur sertifikasi, serta cara ikut berkontribusi pada proyek open source Redis.'
  ],
  objectives: [
    'Menyusun arsitektur API produk dengan pola handler, service, repository, dan lapisan cache-aside',
    'Menerapkan pembatalan cache yang tepat ketika produk dibuat, diubah, dan dihapus',
    'Melindungi API dengan rate limiting per API key serta blacklist token untuk jalur logout',
    'Menyiapkan health check, graceful shutdown, dan checklist rilis produksi sebelum naik ke pengguna sungguhan'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Studi Kasus dan Arsitektur Proyek</h3><p>Proyeknya sederhana tetapi mewakili pola yang dipakai hampir semua API modern: katalog produk dengan operasi baca dan tulis lengkap. Yang menarik bukan operasinya, melainkan bagaimana <b>lapisan cache disisipkan</b> tanpa mengotori kode.</p><p>Struktur proyek mengikuti tiga lapis klasik: <b>handler</b> menerima permintaan HTTP dan memvalidasi masukan, <b>service</b> memegang aturan bisnis dan menjadi tempat cache dipasang, <b>repository</b> berbicara dengan MariaDB tanpa tahu-menahu soal Redis. Dengan pembagian ini, menghapus cache sama sekali hanya membuat aplikasi menjadi lebih lambat, bukan menjadi rusak.</p><table><thead><tr><th>Endpoint</th><th>Peran</th><th>Sentuhan Redis</th></tr></thead><tbody><tr><td><b>GET /products/{id}</b></td><td>Menampilkan detail satu produk</td><td>Cache-aside: baca cache, miss ke MariaDB, lalu isi ulang</td></tr><tr><td><b>GET /products</b></td><td>Menampilkan daftar produk berhalaman</td><td>Cache daftar dengan nomor generasi agar mudah dibatalkan</td></tr><tr><td><b>POST /products</b></td><td>Membuat produk baru</td><td>Rate limit per API key dan pembatalan cache daftar</td></tr><tr><td><b>PUT /products/{id}</b></td><td>Mengubah data produk</td><td>Menghapus kunci cache produk tersebut</td></tr><tr><td><b>DELETE /products/{id}</b></td><td>Menghapus produk</td><td>Menghapus kunci produk dan menaikkan generasi daftar</td></tr></tbody></table>'
    },
    {
      type: 'text',
      html: `<h3>Arsitektur Proyek Akhir</h3><p>Setiap permintaan melewati dua percabangan: ke Redis lebih dulu untuk kecepatan, dan ke MariaDB ketika cache tidak punya jawaban. Seluruh lima langkah praktik berikutnya menempel pada percabangan ini.</p><figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Arsitektur proyek akhir: klien memanggil Go API yang menerapkan cache-aside dan rate limit, lalu berbicara ke Redis untuk cache dan MariaDB untuk sumber kebenaran">
        <rect x="20" y="75" width="150" height="70" rx="10" class="u-box"/>
        <text x="95" y="105" class="u-title" text-anchor="middle">Klien API</text>
        <text x="95" y="127" class="u-lbl" text-anchor="middle">browser / aplikasi mobile</text>

        <line x1="176" y1="110" x2="214" y2="110" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="196" y="172" class="u-lbl" text-anchor="middle">GET /products/9</text>

        <rect x="220" y="55" width="190" height="110" rx="10" class="u-hl"/>
        <text x="315" y="85" class="u-title" text-anchor="middle">Go API (REST)</text>
        <text x="315" y="108" class="u-lbl" text-anchor="middle">handler → service → repository</text>
        <text x="315" y="130" class="u-lbl" text-anchor="middle">cache-aside + rate limit per API key</text>
        <text x="315" y="150" class="u-lbl" text-anchor="middle">health check + graceful shutdown</text>

        <rect x="470" y="40" width="170" height="65" rx="10" class="u-box"/>
        <text x="555" y="68" class="u-title" text-anchor="middle">Redis</text>
        <text x="555" y="90" class="u-lbl" text-anchor="middle">cache · rate limit · blacklist</text>

        <line x1="414" y1="85" x2="464" y2="80" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="439" y="68" class="u-lbl" text-anchor="middle">cache</text>

        <rect x="470" y="145" width="170" height="65" rx="10" class="u-box"/>
        <text x="555" y="173" class="u-title" text-anchor="middle">MariaDB</text>
        <text x="555" y="195" class="u-lbl" text-anchor="middle">sumber kebenaran produk</text>

        <line x1="414" y1="140" x2="464" y2="175" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="439" y="152" class="u-lbl" text-anchor="middle">query</text>

        <rect x="20" y="235" width="710" height="45" rx="10" class="u-box"/>
        <text x="375" y="263" class="u-lbl" text-anchor="middle">Alur baca: cek Redis → kena cache → jawab cepat · miss → baca MariaDB → isi ulang cache dengan umur 5 menit</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 16.1</b> — Arsitektur proyek akhir: klien memanggil Go API, cache-aside menempatkan Redis di jalur cepat, MariaDB tetap menjadi sumber kebenaran</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Langkah 1: Cache-Aside pada GET /products/{id}',
      lang: 'go',
      output: false,
      code: `package product

import (
	"context"
	"encoding/json"
	"errors"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
)

// GetByID menerapkan cache-aside: baca cache, jangan-jangan miss,
// lalu isi ulang dari repository yang bicara ke MariaDB.
func GetByID(ctx context.Context, rdb *redis.Client, repo Repository, id int64) (*Product, error) {
	key := "product:" + strconv.FormatInt(id, 10)

	raw, err := rdb.Get(ctx, key).Bytes()
	if err == nil {
		var p Product
		if uErr := json.Unmarshal(raw, &p); uErr == nil {
			return &p, nil // kena cache: MariaDB tidak tersentuh sama sekali
		}
	} else if !errors.Is(err, redis.Nil) {
		// Redis bermasalah: perlakukan sebagai miss biasa, layanan tetap berjalan
	}

	p, err := repo.FindByID(ctx, id) // miss: baca sumber kebenaran
	if err != nil {
		return nil, err
	}
	data, mErr := json.Marshal(p)
	if mErr == nil {
		rdb.Set(ctx, key, data, 5*time.Minute) // kegagalan menulis cache diabaikan
	}
	return p, nil
}`,
      explain: [
        'Pola <i>cache-aside</i> berarti layanan tidak pernah mempercayai cache sebagai pemilik data: ia hanya tempat singgah yang mempercepat, sedangkan keputusan akhir selalu berasal dari MariaDB.',
        'Ketiadaan kunci dibaca sebagai <code>redis.Nil</code> dan diperlakukan sebagai miss biasa; kegagalan koneksi pun sengaja diperlakukan sama agar Redis yang sedang mati tidak ikut mematikan pembacaan produk.',
        'Umur lima menit membatasi seberapa basi sebuah salinan; nama kunci memakai pola <code>jenis:objek:identitas</code> agar mudah dikenali saat insiden maupun saat memasang aturan ACL.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Langkah 2: Membatalkan Cache Saat Menulis</h3><p>Cache yang hanya dibaca tanpa pernah dibatalkan adalah tab yang hanya dipasang tanpa pernah dicopot. Pengguna mengubah harga di panel admin, lalu lima menit kemudian halaman produk masih menampilkan harga lama — lama-lama orang mempertanyakan kejujuran sistem, bukan kecepatannya.</p><p>Aturan pembatalannya: <b>tulis ke MariaDB lebih dulu, baru hapus cache</b>. Bila penghapusan gagal, umur cache tetap membatasi kerusakan, dan kegagalan itu dicatat untuk diselidiki, bukan untuk membatalkan operasi yang sudah berhasil di database. Satu perdebatan lama menyebutkan urutan hapus-dulu agar tidak ada jendela berisi data basi; praktik yang lebih umum adalah menulis dulu karena konsekuensi cache kosong jauh lebih ringan daripada database yang tidak konsisten.</p><p><b>Anti-pattern yang sering ditemui:</b> menjadikan TTL sebagai satu-satunya mekanisme pembatalan. Umur panjang membuat data basi terlihat lama, umur pendek membuat manfaat cache lenyap. Pembatalan aktif saat menulis adalah jawaban yang benar, dengan TTL tetap dipasang sebagai jaring pengaman terakhir, bukan sebagai pengganti.</p><p>Masalah khusus muncul pada kunci daftar: halaman pertama bisa jadi <code>product:list:1</code>, halaman kedua <code>product:list:2</code>, dan seterusnya — kamu tidak mungkin menebak seluruhnya untuk dihapus. Penyelesaiannya bernama <b>generasi</b>: sebuah nomor yang dinaikkan setiap kali data berubah, sehingga seluruh halaman lama otomatis menjadi yatim dan menghilang sendiri saat umurnya habis.</p>'
    },
    {
      type: 'example',
      title: 'Langkah 2: Invalidasi saat PUT dan DELETE',
      lang: 'go',
      output: false,
      code: `package product

import (
	"context"
	"log"
	"strconv"

	"github.com/redis/go-redis/v9"
)

type Service struct {
	rdb  *redis.Client
	repo Repository
	log  *log.Logger
}

// Update menulis ke MariaDB lebih dulu, lalu membatalkan cache terkait.
func (s *Service) Update(ctx context.Context, p *Product) error {
	if err := s.repo.Update(ctx, p); err != nil {
		return err // tulis gagal: cache tidak disentuh sama sekali
	}

	key := "product:" + strconv.FormatInt(p.ID, 10)
	if err := s.rdb.Del(ctx, key).Err(); err != nil {
		// pembatalan gagal bukan alasan membatalkan: umur cache tetap membatasi usia data
		s.log.Printf("pembatalan %s gagal: %v", key, err)
	}

	// menaikkan generasi membuat seluruh halaman daftar lama ikut basi
	if _, err := s.rdb.Incr(ctx, "product:gen").Result(); err != nil {
		s.log.Printf("generasi daftar gagal dinaikkan: %v", err)
	}
	return nil
}

// Daftar membaca nomor generasi sehingga hanya halaman terbaru yang sah.
func (s *Service) Daftar(ctx context.Context, halaman int) ([]Product, error) {
	gen, err := s.rdb.Get(ctx, "product:gen").Int64()
	if err != nil {
		gen = 0
	}
	key := "product:list:" + strconv.FormatInt(gen, 10) + ":" + strconv.Itoa(halaman)
	_ = key // gunakan persis seperti pada GetByID: baca, miss ke repository, isi ulang
	return s.repo.FindPage(ctx, halaman)
}`,
      explain: [
        'Urutan yang diingat satu kalimat: <b>database dulu, cache kemudian</b>. Selama penulisan gagal, cache tidak pernah disentuh sehingga tidak ada data basi yang tercipta.',
        'Kegagalan penghapusan dicatat sebagai log, bukan menggagalkan permintaan; umur cache lima menit menjamin kesalahan itu membekas sebentar saja.',
        'Trik generasi mengubah tugas mustahil (menghapus semua halaman daftar) menjadi satu perintah inkrementasi; halaman lama tetap di memori sampai umurnya habis, tanpa perlu memindai jutaan kunci dengan <code>KEYS</code>.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Langkah 3: Rate Limiting per API Key</h3><p>Pelanggan berbayar memiliki kuota yang berbeda-beda, sehingga pembatasan laju harus dikenali per API key, bukan per alamat jaringan. Sebelum menulis kode, mari bandingkan dua pendekatan yang akan dipasang berdampingan pada proyek ini.</p><table><thead><tr><th>Sisi</th><th>INCR + EXPIRE</th><th>Token bucket dengan Lua</th></tr></thead><tbody><tr><td><b>Kesederhanaan</b></td><td>Dua perintah, langsung terbaca</td><td>Perlu skrip Lua yang dijalankan serempak</td></tr><tr><td><b>Bentuk kuota</b></td><td>Jumlah tetap per periode</td><td>Laju tetap dengan lonjakan terbatas</td></tr><tr><td><b>Di batas periode</b></td><td>Rawan lonjakan ganda antar dua periode berdekatan</td><td>Kontinu, tanpa celah di batas waktu</td></tr><tr><td><b>Umpan balik ke klien</b></td><td>Sisa kuota yang mudah dihitung</td><td>Sisa token dan kapan ember terisi kembali</td></tr><tr><td><b>Cocok untuk</b></td><td>Kuota harian atau bulanan yang kasar</td><td>API berbayar yang butuh kelancaran dan keadilan</td></tr></tbody></table><p>Praktik yang lazim: memakai keduanya sekaligus. Kuota harian dengan <code>INCR</code> menjadi pagar keras yang tidak boleh ditembus, sedangkan token bucket menjadi pengatur agar pengguna dengan trafik pulsa tetap merata tidak mengantre di balik pagar yang sama.</p>'
    },
    {
      type: 'example',
      title: 'Langkah 3: Kuota Harian dan Token Bucket',
      lang: 'redis',
      output: false,
      code: `# --- Pagar keras: kuota harian 1000 permintaan per API key ---
SET     quota:daily:abc123:20261020 0 EX 86400 NX
INCR    quota:daily:abc123:20261020
GET     quota:daily:abc123:20261020
TTL     quota:daily:abc123:20261020

# --- Pengatur halus: token bucket, 10 token per detik, ember berisi 20 ---
local key   = KEYS[1]
local rate  = tonumber(ARGV[1])
local cap   = tonumber(ARGV[2])
local now   = tonumber(ARGV[3])

local tokens = tonumber(redis.call('HGET', key, 'tokens'))
local ts     = tonumber(redis.call('HGET', key, 'ts'))
if tokens == nil then tokens = cap end
if ts == nil then ts = now end

local delta = math.max(0, now - ts) / 1000
tokens = math.min(cap, tokens + delta * rate)

local allowed = 0
if tokens >= 1 then
  tokens = tokens - 1
  allowed = 1
end

redis.call('HSET', key, 'tokens', tokens, 'ts', now)
redis.call('EXPIRE', key, math.ceil(cap / rate) + 10)
return allowed`,
      explain: [
        'Blok Lua berjalan sebagai satu kesatuan yang tidak bisa disela: membaca sisa token, menambah dari selisih waktu, lalu memotong satu token berlangsung serempak meski ribuan permintaan datang bersamaan.',
        'Umur key token bucket disetel dari waktu ember terisi penuh ditambah cadangan, sehingga klien yang berhenti memakai API tidak meninggalkan sampah kunci di memori.',
        'Kedua lapis dipanggil berurutan di middleware: kuota harian menolak dengan 429 bila pagar ditembus, sedangkan token bucket menolak bila ember sedang kosong.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Langkah 4 dan 5: Logout yang Benar dan Berhenti yang Rapi</h3><p>Token <b>JWT</b> dirancang tanpa penyimpanan server: selama tokennya masih berumur, ia sah di mana pun dibaca. Sifat itu efisien, tetapi membuat tombol keluar tampak percuma — token yang sudah dicuri tetap berlaku sampai waktunya habis. Penyelesaiannya ringkas: simpan nomor token yang sudah keluar pada kunci berumur, dan biarkan umur itu mengikuti sisa umur token sehingga pembersihan terjadi sendiri.</p><p>Langkah kelima menutup proyek dengan dua kebiasaan yang membedakan aplikasi yang enak dijaga dengan aplikasi yang bikin was-was. Yang pertama adalah <b>health check</b>: satu endpoint kecil yang menelepon Redis dengan batas waktu pendek dan menjawab sehat atau sakit — endpoint inilah yang dibaca orkestrator dan monitor luar untuk memutuskan apakah sebuah instance layak menerima trafik.</p><p>Yang kedua adalah <b>graceful shutdown</b>: ketika menerima sinyal berhenti, aplikasi berhenti menerima permintaan baru, menunggu permintaan yang sedang berjalan tuntas, lalu menutup seluruh koneksi dari <i>pool</i> Redis. Tanpa langkah terakhir itu, setiap penerbitan meninggalkan koneksi yatim yang perlahan menumpuk, dan suatu hari Redis menolak koneksi baru dengan pesan yang terasa datang tanpa peringatan.</p>'
    },
    {
      type: 'example',
      title: 'Langkah 4: Blacklist Token Logout',
      lang: 'redis',
      output: false,
      code: `# Saat logout, catat nomor token (jti) sampai token itu sendiri kedaluwarsa
SET blacklist:token:jti-xyz-123 1 EX 1800

# Sebelum memproses permintaan berikutnya
EXISTS blacklist:token:jti-xyz-123
TTL    blacklist:token:jti-xyz-123

# Tidak ada kunci blacklist berarti token masih sah dipakai
# Kunci hilang sendiri ketika umurnya habis: tanpa jadwal pembersihan`,
      explain: [
        'Umur kunci disamakan dengan sisa umur token, sehingga daftar blokir tidak pernah lebih panjang dari yang benar-benar diperlukan dan dibersihkan sendiri oleh Redis.',
        'Satu <code>EXISTS</code> per permintaan adalah harga yang sangat murah dibanding manfaatnya: pengguna benar-benar keluar, bukan sekadar berpura-pura.',
        'Bila suatu saat kelak daftar blokir perlu diaudit, kuncinya mudah dipindai dengan pola <code>blacklist:token:*</code> tanpa menyentuh wilayah data lain.'
      ]
    },
    {
      type: 'example',
      title: 'Langkah 5: Health Check dan Graceful Shutdown',
      lang: 'go',
      output: false,
      code: `package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/redis/go-redis/v9"
)

func main() {
	rdb := redis.NewClient(&redis.Options{
		Addr:     os.Getenv("REDIS_ADDR"),
		Password: os.Getenv("REDIS_PASSWORD"),
		DB:       0,
	})
	defer rdb.Close()

	boot, batal := context.WithTimeout(context.Background(), 3*time.Second)
	defer batal()
	if err := rdb.Ping(boot).Err(); err != nil {
		log.Fatalf("redis belum siap: %v", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		c, stop := context.WithTimeout(r.Context(), 500*time.Millisecond)
		defer stop()
		if err := rdb.Ping(c).Err(); err != nil {
			http.Error(w, "redis tidak terjangkau", http.StatusServiceUnavailable)
			return
		}
		w.WriteHeader(http.StatusOK)
	})

	srv := &http.Server{Addr: ":8080", Handler: mux}
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server berhenti: %v", err)
		}
	}()

	beri := make(chan os.Signal, 1)
	signal.Notify(beri, syscall.SIGINT, syscall.SIGTERM)
	<-beri

	berhenti, batalkan := context.WithTimeout(context.Background(), 10*time.Second)
	defer batalkan()
	_ = srv.Shutdown(berhenti) // berhenti menerima permintaan baru, tunggu yang berjalan
	_ = rdb.Close()            // tutup seluruh koneksi milik pool
	log.Println("berhenti dengan rapi")
}`,
      explain: [
        'Endpoint <code>/healthz</code> memakai batas waktu setengah detik agar pemeriksaan kesehatan tidak pernah menjadi beban tambahan bagi Redis yang sedang sibuk.',
        'Urutan pemadaman penting: <code>srv.Shutdown</code> lebih dulu berarti tidak ada permintaan baru yang tiba-tiba menemui koneksi Redis yang sudah ditutup.',
        '<code>rdb.Close()</code> melepas seluruh koneksi dari pool; proses yang berhenti tanpa langkah ini meninggalkan jejak koneksi mati yang perlahan menggerogoti batas koneksi server.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Checklist Rilis Produksi dan Ide Lanjutan</h3><p>Sebelum proyek menemui pengguna sungguhan, jalankan pemeriksaan berikut. Setiap baris punya contoh nilai awal yang wajar, bukan angka final — sesuaikan dengan hasil ukur di lingkunganmu sendiri.</p><table><thead><tr><th>Aspek</th><th>Yang diperiksa</th><th>Contoh nilai awal</th></tr></thead><tbody><tr><td><b>Keamanan</b></td><td>Kata sandi atau ACL per layanan, pembatasan alamat, mode terlindungi</td><td><code>bind</code> hanya ke loopback, pengguna aplikasi dengan hak terbatas</td></tr><tr><td><b>Memori</b></td><td>Batas pemakaian dan kebijakan pengusiran yang sesuai sifat data</td><td><code>maxmemory</code> 512mb dengan <code>allkeys-lru</code> untuk cache murni</td></tr><tr><td><b>Persistence</b></td><td>AOF hibrida agar pemulihan cepat sekaligus lengkap</td><td><code>appendonly yes</code>, <code>appendfsync everysec</code>, pembukaan ulang berbasis RDB aktif</td></tr><tr><td><b>Ketersediaan</b></td><td>Sentinel atau cluster agar kegagalan satu node tidak menghentikan layanan</td><td>Satu master dengan dua sentinel dan pengalihan otomatis</td></tr><tr><td><b>Monitoring</b></td><td>Exporter yang mengekspos metrik beserta aturan peringatan</td><td>redis_exporter pada 9121, peringatan hit rate rendah dan eviction</td></tr><tr><td><b>Backup</b></td><td>Jadwal penyalinan berkas simpan ke tempat yang aman</td><td>Penyalinan <code>dump.rdb</code> setiap jam ke objek storage</td></tr><tr><td><b>Uji beban</b></td><td>Pengukuran angka sebelum dan sesudah cache dipasang</td><td>redis-benchmark untuk server, k6 untuk jalur API lengkap</td></tr></tbody></table><p><b>Ide lanjutan bagi yang ingin naik kelas:</b> modul <b>RediSearch</b> membawa pencarian indeks, filter numerik, dan pengurutan yang jauh melampaui kemampuan pencarian pola biasa; <b>RedisJSON</b> menyimpan dokumen JSON sebagai tipe data tersendiri lengkap dengan kemampuan menambah field tanpa menulis ulang seluruh dokumen. Masih ada lagi yang layak dijajal: filter <i>bloom</i> untuk pertanyaan "mungkin pernah ada", deret waktu untuk data metrik, dan RediSearch pada katalog produk yang tumbuh besar. Selain teknis, jalur profesionalnya terbuka lebar lewat sertifikasi Redis serta kontribusi open source — mulai dari memperbaiki dokumentasi proyek <code>redis/redis</code>, <code>go-redis</code>, atau <code>redis_exporter</code>, sampai menulis pengujian yang kelak dipakai ribuan orang.</p>'
    },
    {
      type: 'tip',
      title: 'Ukur Sebelum dan Sesudah',
      text: 'Sebelum memasang cache, jalankan <code>redis-benchmark</code> untuk memastikan Redis sehat lalu ukur jalur API dengan k6 dan catat angka median dan persentil 95. Setelah cache terpasang, ukur ulang dengan skenario yang sama. Dua kolom angka itu bukan sekadar laporan kebanggaan — ia yang kelak menentukan berapa <code>maxmemory</code> yang pantas dan apakah cache 5 menit sudah tepat.'
    },
    {
      type: 'warn',
      title: 'Cache Hanya Mempercepat, Bukan Satu-satunya Rumah Data',
      text: 'Setiap byte yang disimpan di Redis pada proyek ini harus memiliki salinan resmi di MariaDB. Uji yang mudah: matikan Redis selama satu menit, lalu pastikan aplikasi tetap melayani permintaan (lebih lambat, tetapi tetap benar). Bila ada data yang hanya hidup di Redis, kamu tidak sedang membangun cache — kamu sedang membangun basis data tanpa jaminan yang sewaktu-waktu bisa mengusir datanya sendiri.'
    },
    {
      type: 'vocab',
      items: [
        ['Cache-aside', 'Pola menaruh cache di sisi layanan: baca cache lebih dulu, jangan-jangan ke database, lalu isi ulang cache.'],
        ['Invalidation', 'Pembatalan cache saat data asli berubah, dilakukan dengan menghapus kunci terkait setelah penulisan database berhasil.'],
        ['Generasi kunci', 'Nomor yang dinaikkan setiap kali data berubah sehingga seluruh kunci lama otomatis dianggap basi tanpa perlu dihapus satu per satu.'],
        ['Token bucket', 'Laju tetap dengan lonjakan terbatas; dijalankan dengan skrip Lua agar penambahan dan pemotongan token berlangsung serempak.'],
        ['Blacklist token', 'Daftar token yang sudah keluar disimpan sebagai kunci berumur, sehingga logout benar-benar mencabut izin token JWT.'],
        ['Graceful shutdown', 'Proses berhenti dengan rapi: berhenti menerima permintaan baru, tunggu yang berjalan, lalu tutup koneksi pool.'],
        ['Health check', 'Endpoint pemeriksaan kesehatan yang menelepon Redis dengan batas waktu pendek untuk memberi tahu orkestrator status sehat atau sakit.'],
        ['AOF hibrida', 'Mode penyimpanan yang menggabungkan catatan perintah (AOF) dengan berkas ringkas (RDB) agar pemulihan cepat sekaligus lengkap.']
      ]
    }
  ],
  recap: [
    'API produk dibangun berlapis: handler menerima HTTP, service memegang aturan bisnis dan cache, repository bicara ke MariaDB — sehingga menghapus cache hanya membuat aplikasi lambat, bukan rusak.',
    'Cache-aside membaca Redis lalu jatuh ke database saat miss; pembatalan dilakukan dengan menghapus kunci terkait setelah penulisan database berhasil, ditambah kenaikan generasi untuk seluruh halaman daftar.',
    'Perlindungan API memakai dua lapis: kuota harian dengan INCR dan EXPIRE sebagai pagar keras, token bucket berbasis Lua sebagai pengatur halus, serta blacklist token ber-TTL untuk logout yang benar.',
    'Rilis produksi ditutup dengan health check, graceful shutdown yang menutup pool koneksi, dan checklist yang mencakup keamanan, memori, persistence, ketersediaan, monitoring, backup, dan uji beban.'
  ]
});
