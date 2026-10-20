/* ============================================================
   Pelajaran Redis — Bab 9: Session Store, Rate Limiting & Keamanan
   ============================================================ */
'use strict';

window.REDIS_LESSONS = window.REDIS_LESSONS || [];

window.REDIS_LESSONS.push({
  id: 'session-ratelimit-keamanan',
  title: 'Session Store, Rate Limiting & Keamanan',
  chapter: 'Fitur Lanjutan',
  duration: '12–14 menit',
  intro: [
    'Pernahkah kamu login di satu situs, lalu beberapa detik kemudian diminta login lagi padahal barusan mengetik kata sandi? Atau sebaliknya, kamu sudah menekan tombol keluar tetapi tombol akun masih tetap aktif? Cerita itu berhubungan langsung dengan tempat aplikasi menyimpan <b>session</b>. Redis adalah rumah paling populer untuk session: sangat cepat, mendukung kedaluwarsa otomatis, dan membuat satu server bisa "mengingat" pengguna tanpa harus menyimpan seluruh riwayat di dalam cookie browser.',
    'Selain session, Redis juga sering dipakai sebagai penjaga gerbang aplikasi lewat <b>rate limiting</b> — membatasi berapa kali satu IP, satu API key, atau satu pengguna boleh memanggil API dalam periode tertentu. Tanpa pembatasan ini, satu klien yang galak (atau penyerang) bisa membanjiri server, sementara pengguna lain harus antre. Konsepnya sederhana: hitung di memori Redis yang berbagi angka antar banyak instance aplikasi, lalu putuskan izinkan atau tolak dalam hitungan mikrodetik.',
    'Bagian terakhir bab ini adalah lapisan keamanan produksi: password vs ACL, pembatasan alamat jaringan, pemisahan container Docker dari internet, TLS singkat, sampai mematikan perintah berbahaya. Setelah bab ini kamu punya tiga resep siap pakai: <b>session store</b> yang tahan skala horizontal, <b>rate limiter</b> tiga algoritma lengkap dengan tabel perbandingannya, dan <b>checklist keamanan Redis</b> sebelum naik ke server produksi.'
  ],
  objectives: [
    'Menyimpan, membaca, dan menghapus session di Redis beserta TTL idle dan TTL absolut',
    'Membandingkan fixed window, sliding window, dan token bucket untuk rate limiting',
    'Menerapkan rate limiter per IP atau API key dengan perintah Redis dan go-redis',
    'Menerapkan kebijakan keamanan Redis: ACL, bind, protected-mode, jaringan Docker, dan rename-command'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Session: Siapa yang Mengingat Pengguna?</h3><p>Saat pengguna login, aplikasi perlu <b>mengingat identitas</b> di setiap permintaan berikutnya. Ada tiga cara klasik menyimpannya:</p><ul><li><b>Semua di cookie</b> — server menaruh data session di cookie browser, lalu membacanya kembali tiap request. Ringan, tetapi ukurannya terbatas (sekitar 4 KB), bisa diubah pengguna, dan harus ditandatangani agar tidak dimanipulasi.</li><li><b>Di database relasional</b> — aman dan bisa ditanya dengan SQL, tetapi tabel session tumbuh sangat cepat, query-nya berulang tiap request, dan penghapusannya sering lupa dijadwalkan.</li><li><b>Di Redis</b> — server cukup mengirim <b>ID session pendek</b> (misalnya <code>s_9f3a...</code>) lewat cookie, lalu seluruh isi session hidup sebagai <b>JSON di Redis</b> dengan umur yang bisa diatur otomatis.</li></ul><p>Konsepnya mirip loker di stasiun kereta: kamu tidak membawa seluruh isi tas ke mana-mana, kamu hanya memegang kunci (cookie berisi <code>sid</code>). Tasnya tetap diam di loker (Redis), dan loker itu otomatis dibongkar oleh petugas bila tidak dipakai dalam waktu tertentu (TTL).</p><p>Dua jenis kedaluwarsa perlu dibedakan:</p><ul><li><b>TTL idle</b> — batas waktu sejak terakhir kali session dipakai. Pengguna yang pergi meninggalkan tab selama 30 menit dianggap selesai, session-nya dihapus otomatis oleh Redis.</li><li><b>TTL absolut</b> — batas total umur session sejak pertama dibuat, berapa pun aktivitasnya. Umumnya dipakai untuk paksa login ulang berkala demi keamanan.</li></ul>'
    },
    {
      type: 'example',
      title: 'Siklus Hidup Session di Redis',
      lang: 'bash',
      output: false,
      code: `# 1) Login: buat session dengan isi JSON dan umur 30 menit
redis-cli SET "sess:s_9f3a71" '{"uid":4217,"name":"Dewi","role":"member"}' EX 1800

# 2) Setiap request: baca session (cepat, tanpa query database)
redis-cli GET "sess:s_9f3a71"

# 3) Perpanjang umur idle setelah pengguna aktif (sliding expiration)
redis-cli EXPIRE "sess:s_9f3a71" 1800

# 4) Cek sisa umur sebelum dipakai
redis-cli TTL "sess:s_9f3a71"

# 5) Logout: hapus session seketika di seluruh server aplikasi
redis-cli DEL "sess:s_9f3a71"

# 6) Paksa keluar semua perangkat satu pengguna (misal ganti kata sandi)
redis-cli --scan --pattern "sess:*:uid:4217" | xargs -r redis-cli DEL`,
      explain: [
        'Perintah <code>SET ... EX 1800</code> menulis session sekaligus menetapkan umur 1800 detik; begitu waktunya lewat, Redis menghapusnya sendiri tanpa bantuan kursor pembersih.',
        '<code>EXPIRE</code> dipanggil ulang pada tiap request aktif sehingga umurnya bergeser terus (TTL idle), sementara nilai absolut sebaiknya disimpan di dalam JSON agar tidak ikut bergeser.',
        'Baris terakhir memperlihatkan keunggulan logout di Redis: menghapus satu pola key langsung berlaku untuk <b>semua instance aplikasi</b>, termasuk yang berjalan di node lain.'
      ]
    },
    {
      type: 'example',
      title: 'Middleware Session dengan go-redis v9',
      lang: 'go',
      output: false,
      code: `package session

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/redis/go-redis/v9"
)

type Store struct {
	rdb    *redis.Client
	idle   time.Duration
	abs    time.Duration
}

func NewStore(addr string) *Store {
	return &Store{
		rdb:  redis.NewClient(&redis.Options{Addr: addr}),
		idle: 30 * time.Minute,
		abs:  12 * time.Hour,
	}
}

type Session struct {
	UserID int64
	Name   string
	Role   string
}

func (s *Store) Create(ctx context.Context, sid string, sess Session) error {
	raw, err := json.Marshal(sess)
	if err != nil {
		return err
	}
	pipe := s.rdb.TxPipeline()
	pipe.Set(ctx, "sess:"+sid, raw, s.idle)
	pipe.Set(ctx, "sessabs:"+sid, "1", s.abs)
	_, err = pipe.Exec(ctx)
	return err
}

func (s *Store) Load(ctx context.Context, sid string) (*Session, error) {
	abs, err := s.rdb.Exists(ctx, "sessabs:"+sid).Result()
	if err != nil || abs == 0 {
		return nil, http.ErrNoCookie
	}
	raw, err := s.rdb.Get(ctx, "sess:"+sid).Bytes()
	if err != nil {
		return nil, http.ErrNoCookie
	}
	s.rdb.Expire(ctx, "sess:"+sid, s.idle)
	var sess Session
	if err := json.Unmarshal(raw, &sess); err != nil {
		return nil, err
	}
	return &sess, nil
}

func (s *Store) Destroy(ctx context.Context, sid string) error {
	pipe := s.rdb.TxPipeline()
	pipe.Del(ctx, "sess:"+sid)
	pipe.Del(ctx, "sessabs:"+sid)
	_, err := pipe.Exec(ctx)
	return err
}`,
      explain: [
        'Dua key dipakai bersama: <code>sess:sid</code> menyimpan isi session dengan umur idle, sedangkan <code>sessabs:sid</code> menyimpan penanda umur absolut sehingga perpanjangan otomatis tidak memperpanjang batas keamanannya.',
        '<code>TxPipeline</code> menggabungkan beberapa perintah dalam satu putaran jaringan; meski bersifat optimis (bukan transaksi besar), jauh lebih murah daripada memanggil perintah satu per satu.',
        'Kegagalan membaca key diubah menjadi <code>http.ErrNoCookie</code>, sehingga middleware HTTP tinggal mengarahkan pengguna ke halaman login tanpa membedah penyebab teknisnya.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Redis vs Cookie vs Database untuk Session</h3><table><thead><tr><th>Aspek</th><th>Cookie saja</th><th>Database relasional</th><th>Redis</th></tr></thead><tbody><tr><td><b>Kecepatan baca</td><td>Sangat cepat, tetapi tetap lewat jaringan</td><td>Query tiap request, paling lambat</td><td>Sub-milidetik, in-memory</td></tr><tr><td><b>Kedaluwarsa otomatis</b></td><td>Tidak ada; klien yang menentukan</td><td>Perlu kursor pembersih terjadwal</td><td>Bawaan lewat TTL</td></tr><tr><td><b>Skala horizontal</b></td><td>Otomatis (data ikut klien)</td><td>Butuh database bersama yang jadi titik berat</td><td>Inti keunggulannya: semua node baca satu sumber</td></tr><tr><td><b>Logout seketika</b></td><td>Sulit: cookie lama bisa masih disimpan</td><td>Bisa, tetapi lewat query DELETE</td><td>DEL langsung berlaku di semua node</td></tr><tr><td><b>Ukuran data</b></td><td>Maksimal sekitar 4 KB</td><td>Bebas, tetapi membebani disk</td><td>Bebas, tetapi diingatkan untuk tetap kecil</td></tr><tr><td><b>Risiko utama</b></td><td>Bocor dan bisa dimanipulasi klien</td><td>Tabel membengkak bila pembersihan lupa</td><td>Hilang bila Redis mati tanpa persistence</td></tr></tbody></table><p>Alasan utama Redis menang untuk aplikasi multi-server: ketika ada empat instance aplikasi di belakang load balancer, session di Redis dijamin terlihat oleh semuanya. Pindah instance tidak membuat pengguna keluar, dan <b>logout cukup satu perintah DEL</b> yang langsung berlaku di mana-mana — sesuatu yang sulit dicapai bila session bersembunyi di cookie.</p>'
    },
    {
      type: 'text',
      html: '<h3>Bagaimana Rate Limiter Memutuskan</h3>' + `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 350" width="760" role="img" aria-label="Alur rate limiter fixed window: request masuk, INCR counter, cek batas, lalu diizinkan atau ditolak dengan status 429">
        <rect x="20" y="40" width="160" height="70" rx="10" class="u-box"/>
        <text x="100" y="70" class="u-title" text-anchor="middle">Request Masuk</text>
        <text x="100" y="94" class="u-lbl" text-anchor="middle">IP / API key</text>

        <rect x="220" y="40" width="180" height="70" rx="10" class="u-box"/>
        <text x="310" y="66" class="u-title" text-anchor="middle">INCR counter:key</text>
        <text x="310" y="90" class="u-lbl" text-anchor="middle">rl:203.0.113.9:202610</text>

        <line x1="184" y1="75" x2="214" y2="75" class="u-line" marker-end="url(#u-arrow)"/>

        <rect x="440" y="40" width="150" height="70" rx="10" class="u-hl"/>
        <text x="515" y="66" class="u-title" text-anchor="middle">Cek Batas</text>
        <text x="515" y="90" class="u-lbl" text-anchor="middle">nilai &lt;= 100?</text>

        <line x1="404" y1="75" x2="434" y2="75" class="u-line" marker-end="url(#u-arrow)"/>

        <rect x="350" y="195" width="180" height="70" rx="10" class="u-box"/>
        <text x="440" y="222" class="u-title" text-anchor="middle">IZINKAN</text>
        <text x="440" y="246" class="u-lbl" text-anchor="middle">lanjut ke handler API</text>

        <rect x="570" y="195" width="170" height="70" rx="10" class="u-hl"/>
        <text x="655" y="222" class="u-title" text-anchor="middle">TOLAK</text>
        <text x="655" y="246" class="u-lbl" text-anchor="middle">429 Too Many Requests</text>

        <line x1="470" y1="114" x2="448" y2="189" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="560" y1="114" x2="645" y2="189" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="392" y="160" class="u-lbl" text-anchor="middle">ya</text>
        <text x="616" y="160" class="u-lbl" text-anchor="middle">tidak</text>

        <rect x="20" y="295" width="720" height="45" rx="10" class="u-box"/>
        <text x="380" y="323" class="u-title" text-anchor="middle">EXPIRE counter 60 detik — jendela ter-reset otomatis saat waktu habis</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 9.1</b> — Alur rate limiter fixed window: setiap request menaikkan penghitung, lalu dibandingkan dengan batas sebelum diizinkan atau ditolak</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Rate Limiting: Tiga Algoritma</h3><p><b>Rate limiting</b> adalah kebijakan "sebanyak ini saja dalam periode ini". Ancamannya nyata: tanpa pembatasan, satu bot bisa mengirim ribuan login per detik untuk menebak kata sandi, atau satu klien yang salah konfigurasi menarik seluruh kuota server. Karena Redis menyediakan operasi atomik di memori, ia menjadi tempat hitung yang ideal — dan umumnya berdiri sebagai <b>satu instance pusat</b> yang dipakai bersama oleh seluruh server aplikasi.</p><p><b>1. Fixed window counter (jendela tetap)</b><p>Paling sederhana: setiap periode (misal 60 detik) memiliki counter sendiri. Tiap request melakukan <code>INCR</code>, bila hasilnya melewati batas, request ditolak, dan <code>EXPIRE</code> memastikan counter hilang saat jendela berganti. Kelemahannya klasik: pada batas dua jendela, klien bisa mengirim 100 request di detik terakhir jendela pertama lalu 100 lagi di detik pertama jendela kedua — 200 request hanya dalam dua detik.</p><p><b>2. Sliding window log (jendela geser)</b><p>Setiap request dicatat sebagai anggota <i>sorted set</i> (ZSET) dengan <i>score</i> berupa timestamp. Sebelum menilai, <code>ZREMRANGEBYSCORE</code> membuang catatan yang sudah lewat dari jendela, lalu <code>ZCARD</code> menghitung sisa catatan. Akurasinya tinggi karena tidak ada "celah batas jendela", tetapi harganya adalah memori: satu klien berfrekuensi tinggi menumpuk banyak entri.</p><p><b>3. Token bucket (ember token)</b><p>Satu ember berisi maksimal <i>b</i> token, token ditambahkan perlahan (misal 10 per detik), dan tiap request "menyedot" satu token. Bila ember kosong, request ditolak; bila penuh, kelebihan token tidak disimpan sehingga tidak bisa menumpuk. Keunggulannya: mengizinkan <b>lonjakan singkat</b> (burst) sebesar ukuran ember, lalu kembali ke laju tetap. Karena harus membaca sisa token, menambah token, dan memotong token <b>secara serempak</b>, algoritma ini dijalankan lewat skrip <b>Lua</b> agar tidak terjadi baca-tulis bersamaan.</p>'
    },
    {
      type: 'example',
      title: 'Fixed Window dan Sliding Window Log',
      lang: 'redis',
      output: false,
      code: `# --- FIXED WINDOW: maksimal 100 request per 60 detik per IP ---
SET     rl:203.0.113.9:20261020T1430 0 EX 60 NX
INCR    rl:203.0.113.9:20261020T1430
EXPIRE rl:203.0.113.9:20261020T1430 60
TTL     rl:203.0.113.9:20261020T1430

# --- SLIDING WINDOW LOG: riwayat 60 detik terakhir dalam satu ZSET ---
# catat request dengan score timestamp milidetik
ZADD   rl:login:203.0.113.9 1760947800123 req:1
ZADD   rl:login:203.0.113.9 1760947800455 req:2

# buang entri yang sudah keluar dari jendela 60 detik
ZREMRANGEBYSCORE rl:login:203.0.113.9 -inf (1760947740123

# jumlah permintaan yang masih berada di dalam jendela
ZCARD  rl:login:203.0.113.9

# simpan riwayat ini selama 2x jendela agar tidak menumpuk lama
EXPIRE rl:login:203.0.113.9 120`,
      explain: [
        'Pada fixed window, <code>SET ... EX 60 NX</code> membuat counter segar begitu jendela baru dimulai, <code>INCR</code> menghitung secara atomik, dan <code>TTL</code> memastikan jendela benar-benar ter-reset sendiri.',
        'Pada sliding window, <i>score</i> berupa timestamp membuat <code>ZREMRANGEBYSCORE</code> mampu membuang seluruh entri lama dalam satu operasi, lalu <code>ZCARD</code> menjadi jumlah request yang sah di jendela berjalan.',
        'Perhatikan selisih 60 detik pada nilai <code>(1760947740123</code>: kurung buka berarti rentang terbuka, sehingga entri persis di batas jendela ikut terbuang.'
      ]
    },
    {
      type: 'example',
      title: 'Token Bucket dengan Skrip Lua (atomik)',
      lang: 'redis',
      output: false,
      code: `-- rate: 10 token/detik, capacity: 20 token (boleh burst sampai 20)
-- hasil: 1 = izinkan, 0 = tolak
local key    = KEYS[1]
local rate   = tonumber(ARGV[1])
local cap    = tonumber(ARGV[2])
local now    = tonumber(ARGV[3])
local need   = tonumber(ARGV[4])

local data = redis.call('HMGET', key, 'tokens', 'ts')
local tokens = tonumber(data[1])
local ts     = tonumber(data[2])

if tokens == nil then
  tokens = cap
  ts = now
end

local delta = math.max(0, now - ts) / 1000
tokens = math.min(cap, tokens + delta * rate)

local allowed = 0
if tokens >= need then
  tokens = tokens - need
  allowed = 1
end

redis.call('HSET', key, 'tokens', tokens, 'ts', now)
redis.call('EXPIRE', key, 60)
return allowed`,
      explain: [
        'Seluruh blok dijalankan Redis sebagai satu unit tunggal: tidak ada request lain yang bisa menyela di antara membaca sisa token dan menulis token baru, sehingga angka tidak pernah kacau walau ribuan request masuk bersamaan.',
        '<i>Timestamp</i> terakhir disimpan bersama token sehingga token yang hilang karena request dihitung ulang dari selisih waktu — inilah cara ember terisi kembali perlahan tanpa proses tambahan.',
        'Pemakaian dari aplikasi: <code>EVAL</code> dengan argumen <code>{"rl:api:KEY", "10", "20", "1760947800123", "1"}</code>; bila hasilnya 0, klien menerima respons 429.'
      ]
    },
    {
      type: 'example',
      title: 'Rate Limiter per IP untuk API di Go',
      lang: 'go',
      output: false,
      code: `package ratelimit

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
)

type Limiter struct {
	rdb   *redis.Client
	limit int64
	window time.Duration
}

func New(addr string, limit int64, window time.Duration) *Limiter {
	return &Limiter{
		rdb:    redis.NewClient(&redis.Options{Addr: addr}),
		limit:  limit,
		window: window,
	}
}

// Allow mengembalikan sisa kuota dan izin untuk satu kunci (IP atau API key).
func (l *Limiter) Allow(ctx context.Context, ident string) (bool, int64, error) {
	period := time.Now().Unix() / int64(l.window.Seconds())
	key := fmt.Sprintf("rl:%s:%d", ident, period)

	n, err := l.rdb.Incr(ctx, key).Result()
	if err != nil {
		return false, 0, err
	}
	if n == 1 {
		if err := l.rdb.Expire(ctx, key, l.window).Err(); err != nil {
			return false, 0, err
		}
	}
	ttl, _ := l.rdb.TTL(ctx, key).Result()
	_ = ttl
	return n <= l.limit, n, nil
}

func (l *Limiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ident := r.Header.Get("X-API-Key")
		if ident == "" {
			ident = r.RemoteAddr
		}
		ok, used, err := l.Allow(r.Context(), ident)
		if err != nil {
			next.ServeHTTP(w, r)
			return
		}
		w.Header().Set("X-RateLimit-Limit", strconv.FormatInt(l.limit, 10))
		w.Header().Set("X-RateLimit-Used", strconv.FormatInt(used, 10))
		if !ok {
			w.Header().Set("Retry-After", strconv.Itoa(int(l.window.Seconds())))
			http.Error(w, "terlalu banyak permintaan, coba lagi nanti", http.StatusTooManyRequests)
			return
		}
		next.ServeHTTP(w, r)
	})
}`,
      explain: [
        'Kunci counter digabung dari identitas (header <code>X-API-Key</code> bila ada, selain itu alamat remote) dan nomor periode, sehingga tiap jendela waktu memiliki angka terpisah dan reset terjadi otomatis lewat TTL.',
        'Respon 429 disertai header standar <code>Retry-After</code> dan <code>X-RateLimit-*</code>, yang membuat klien otomatis tahu kapan boleh mencoba lagi dan berapa kuota yang sudah terpakai.',
        'Karena seluruh instance aplikasi berbagi satu Redis, batas yang kamu tetapkan berlaku global — bukan per server, yang akan melipatgandakan kuota secara diam-diam.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Memilih Algoritma Rate Limiting</h3><table><thead><tr><th>Aspek</th><th>Fixed window</th><th>Sliding window log</th><th>Token bucket</th></tr></thead><tbody><tr><td><b>Struktur data</b></td><td>String counter biasa</td><td>Sorted set (ZSET)</td><td>Hash + skrip Lua</td></tr><tr><td><b>Konsumsi memori</b></td><td>Sangat kecil: satu angka</td><td>Besar: satu entri per request</td><td>Kecil: selalu beberapa field</td></tr><tr><td><b>Akurasi di batas jendela</b></td><td>Kurang, bisa terjadi lonjakan ganda</td><td>Sangat akurat</td><td>Akurat dan bertahap</td></tr><tr><td><b>Izinkan lonjakan (burst)</b></td><td>Ya, sampai batas penuh</td><td>Tidak, laju tetap</td><td>Ya, terkontrol ukuran ember</td></tr><tr><td><b>Kerumitan implementasi</b></td><td>Paling mudah</td><td>Sedang, hati-hati pembersihan</td><td>Paling rumit (Lua)</td></tr><tr><td><b>Cocok untuk</b></td><td>Batas kasar per menit/jam, kuota harian</td><td>API publik yang menuntut keadilan</td><td>API berbayar dengan burst wajar</td></tr></tbody></table><p><b>Anti-pattern yang sering terjadi:</b> menghitung rate limit <i>di dalam</i> tiap instance aplikasi (variabel di memori proses). Saat kamu punya empat server, batas 100 request per menit diam-diam menjadi 400, dan angkanya berubah tiap kali salah satu server di-restart. Patokan yang benar: <b>hitung di Redis, satu sumber angka untuk semua node</b>.</p>'
    },
    {
      type: 'text',
      html: '<h3>Keamanan Produksi: Sebelum Redis Menyentuh Internet</h3><p>Redis lahir dari desain yang percaya pada jaringan lokal yang bersih. Versi lama bahkan berjalan tanpa kata sandi dan tanpa membatasi alamat — dan ketika orang iseng mengetes port 6379 di seluruh internet, ditemukanlah ratusan ribu instance terbuka yang isinya dihapus atau dijadikan <i>crypto miner</i>. Aturan pertama dan paling penting: <b>jangan pernah mem-publish port Redis ke internet</b>. Berikut lapisannya:</p><ul><li><b>Password vs ACL</b> — <code>--requirepass</code> hanya mengunci satu pintu untuk semua orang. <b>ACL</b> (<i>Access Control List</i>, hadir sejak Redis 6) memungkinkan banyak user dengan hak berbeda: satu user aplikasi cukup boleh <code>+get +set +incr</code> pada pola <code>sess:*</code> saja, sedangkan user monitoring cukup <code>+info</code>.</li><li><b>Bind &amp; protected-mode</b> — <code>bind 127.0.0.1</code> membuat Redis hanya mendengar di loopback; <code>protected-mode yes</code> menolak koneksi luar bila tidak ada password dan tidak ada <code>bind</code> eksplisit.</li><li><b>Jaringan Docker</b> — buat <i>network internal</i> yang tidak punya akses keluar, jalankan Redis dan aplikasi di situ, dan <b>jangan tulis <code>-p 6379:6379</code></b>. Port aplikasi (misal 8080) saja yang boleh dipublish.</li><li><b>TLS</b> — bila jalur melintasi jaringan publik atau antar-VPC, gunakan skema <code>rediss://</code> pada port TLS (konvensional 6380) alih-alih <code>redis://</code> di port 6379 yang polos.</li><li><b>rename-command</b> — sembunyikan perintah berbahaya seperti <code>FLUSHALL</code>, <code>KEYS</code>, dan <code>CONFIG</code> agar penyerang yang lolos autentikasi tetap tidak bisa menghapus seluruh data.</li></ul><p>Kunci berpikirnya: pertahanan tidak boleh bergantung pada satu lapis saja. Kata sandi bocor masih bisa ditahan oleh jaringan; jaringan salah konfigurasi masih ditahan oleh ACL yang sempit; dan bila keduanya lolos, audit <code>ACL LOG</code> dan pembatasan perintah tetap membatasi kerusakan.</p>'
    },
    {
      type: 'example',
      title: 'Menyiapkan Redis Aman dengan ACL dan Pembatasan Jaringan',
      lang: 'bash',
      output: false,
      code: `# 1) Buat network internal Docker (tidak punya akses keluar, port tidak dipublish)
podman network create --internal net-redis

# 2) Jalankan Redis: hanya di loopback host, dengan password dan jaringan internal
podman run -d --name redis-prod \\
  --network net-redis \\
  -p 127.0.0.1:6379:6379 \\
  -v ./redis.conf:/usr/local/etc/redis/redis.conf:z \\
  docker.io/library/redis:7-alpine redis-server /usr/local/etc/redis/redis.conf

# 3) Buat user aplikasi dengan hak minimum (hanya kunci session tertentu)
redis-cli ACL SETUSER app on >rahasia123 \\
  ~session:* +get +set +del +expire +ttl +incr \\
  -flushall -keys -config

# 4) User monitoring hanya boleh membaca statistik
redis-cli ACL SETUSER monitor on >kunci-monitor ~* +info +ping -@write -@dangerous

# 5) Lihat pelanggaran ACL yang tertolak
redis-cli ACL LOG 10`,
      explain: [
        'Jaringan <code>--internal</code> membuat container tidak bisa dijangkau dari luar dan tidak punya akses internet; kombinasi dengan <code>-p 127.0.0.1:6379:6379</code> hanya membuka port pada mesin itu sendiri, bukan pada seluruh antarmuka jaringan.',
        'Baris <code>~session:*</code> membatasi user <code>app</code> hanya melihat pola kunci session, dan daftar <code>+perintah</code> memberi izin khusus sementara <code>-flushall -keys -config</code> menutup perintah paling berbahaya secara eksplisit.',
        '<code>ACL LOG</code> mencatat setiap upaya yang ditolak lengkap dengan alamat dan perintahnya — pemeriksaan pertama saat mencurigai ada yang mengendap di sistem.'
      ]
    },
    {
      type: 'example',
      title: 'Konfigurasi redis.conf untuk Produksi (ringkas)',
      lang: 'yaml',
      output: false,
      code: `# redis.conf — potongan konfigurasi minimum yang aman
bind 127.0.0.1
protected-mode yes
port 6379

requirepass GantiDenganKunciPanjangAcak

# Perintah berbahaya disembunyikan, bukan sekadar dilarang
rename-command FLUSHALL ""
rename-command FLUSHDB  ""
rename-command KEYS     ""
rename-command CONFIG   ""

# Batas memori dan kebijakan pengusiran agar tidak bikin server crash
maxmemory 2gb
maxmemory-policy allkeys-lru

# Persistence ringan (detail lengkap di bab berikutnya)
save 900 1
appendonly everysec`,
      explain: [
        'Tanda kutip ganda pada nilai kosong berarti perintah itu benar-benar dihapus dari instance — klien yang memanggilnya akan menerima error "unknown command".',
        '<code>rename-command</code> juga berguna mengganti nama menjadi nilai rahasia sehingga hanya tim operasi yang tahu nama barunya.',
        'Bagian <code>maxmemory</code> menjadi pengaman terakhir: tanpa batas, Redis bisa memenuhi RAM dan memicu <i>out-of-memory killer</i> yang mematikan proses lain di server yang sama.'
      ]
    },
    {
      type: 'tip',
      title: 'Tambahkan Header Rate Limit pada Respons',
      text: 'Selalu kirimkan header <code>X-RateLimit-Limit</code>, <code>X-RateLimit-Remaining</code>, dan <code>Retry-After</code> pada respons 429. Selain memudahkan klien otomatis menunggu, header ini mengubah pengalaman pengembang eksternal dari "API-nya rusak" menjadi "API-nya punya aturan main yang jelas dan bisa saya patuhi".'
    },
    {
      type: 'warn',
      title: 'Redis Bukan untuk Disentuh Internet',
      text: 'Jangan pernah mem-publish port 6379 ke publik, termasuk lewat security group atau firewall yang longgar. Redis bukan aplikasi web: ia tidak dirancang menghadapi trafik liar, sering berjalan tanpa autentikasi pada instalasi awal, dan memiliki perintah yang bisa menghapus seluruh data dalam satu gerakan. Biarkan ia tinggal di jaringan privat, hanya diakses oleh aplikasi di jaringan yang sama.'
    },
    {
      type: 'vocab',
      items: [
        ['Session Store', 'Penyimpanan data sesi pengguna di luar cookie; Redis menjadi pilihan utama karena cepat dan mendukung kedaluwarsa otomatis.'],
        ['SID (session ID)', 'Pengenal pendek yang dikirim lewat cookie; isi session sesungguhnya disimpan di server berdasarkan ID ini.'],
        ['TTL idle', 'Batas umur yang diperpanjang tiap kali session dipakai; sesudahnya key dihapus otomatis oleh Redis.'],
        ['TTL absolut', 'Batas umur total sejak session dibuat, tidak peduli seberapa aktif pengguna memakainya.'],
        ['Rate limiting', 'Kebijakan membatasi jumlah permintaan per identitas dan periode tertentu untuk mencegah penyalahgunaan dan kelebihan beban.'],
        ['Fixed window', 'Penghitung per periode tetap; sederhana tetapi rawan lonjakan ganda di batas dua periode.'],
        ['Sliding window log', 'Riwayat request dalam sorted set dengan timestamp agar batas jendela tidak menyisakan celah.'],
        ['Token bucket', 'Ember token yang terisi perlahan dan disedot tiap request; mengizinkan lonjakan terkontrol dan dijalankan lewat Lua.'],
        ['ACL (Access Control List)', 'Sistem otorisasi Redis 6+ yang membuat banyak user dengan pola kunci dan daftar perintah yang dibatasi.'],
        ['Protected-mode', 'Mode aman bawaan Redis yang menolak koneksi luar bila tidak ada password maupun konfigurasi bind.']
      ]
    }
  ],
  recap: [
    'Session disimpan di Redis sebagai key <code>sess:sid</code> dengan TTL idle dan TTL absolut, sehingga kedaluwarsa terjadi otomatis dan logout cukup satu perintah DEL yang langsung berlaku di semua node.',
    'Tiga algoritma rate limiting punya pertukaran berbeda: fixed window paling hemat, sliding window paling akurat, token bucket mengizinkan lonjakan terkontrol dengan bantuan skrip Lua.',
    'Rate limit wajib dihitung di satu Redis bersama; menghitung per instance membuat batas melipat ganda dan tidak stabil saat node ditambah atau di-restart.',
    'Keamanan produksi berlapis: ACL berhak minimum, bind dan protected-mode, jaringan Docker internal tanpa publish port, TLS dengan rediss://, rename-command, dan tidak pernah mengekspos Redis ke internet.'
  ]
});
