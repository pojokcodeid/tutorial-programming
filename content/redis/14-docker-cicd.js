/* ============================================================
   Pelajaran Redis — Bab 14: Redis dalam Docker & CI/CD
   ============================================================ */
'use strict';

window.REDIS_LESSONS = window.REDIS_LESSONS || [];

window.REDIS_LESSONS.push({
  id: 'docker-cicd',
  title: 'Redis dalam Docker & CI/CD',
  chapter: 'DevOps',
  duration: '10–12 menit',
  intro: [
    'Bayangkan memindahkan kompor gas beserta selang dan tabungnya dari dapur lama ke dapur baru. Yang sering rusak bukan kompornya, melainkan selang yang tidak cocok dan gas yang bocor di sambungan. Aplikasi Redis hidup dengan masalah yang sama: di laptop lancar jaya, pindah ke server lain gagal hanya karena beda versi, beda cara menyetel password, atau beda konfigurasi jaringan.',
    '<b>Docker</b> menyelesaikan masalah itu dengan membungkus Redis beserta konfigurasinya menjadi satu paket yang bisa dijalankan di mana saja. Image resmi <code>redis:7-alpine</code> cukup puluhan megabita, mendukung <i>health check</i> bawaan, dan bisa dijalankan ulang dengan perilaku yang sama persis. Begitu kontainer dipakai, jalur berikutnya adalah otomatisasi: <b>CI/CD</b> yang menjalankan pengujian integrasi terhadap Redis sungguhan setiap kali kode ditulis, lalu membangun image dan menerbitkannya ke registry.',
    'Bab ini membedah empat hal: pilihan image resmi beserta perbedaannya, opsi <code>docker run</code> yang benar-benar penting, berkas <i>docker-compose</i> lengkap dengan <i>healthcheck</i>, volume, batas sumber daya, dan jaringan internal, serta akhirnya pipeline GitHub Actions yang menyediakan Redis sebagai layanan pendukung job, lengkap dengan daftar anti-pattern CI yang wajib dihindari.'
  ],
  objectives: [
    'Memilih antara image redis:7-alpine dan redis:7 sesuai kebutuhan beserta alasannya',
    'Menjalankan Redis dengan opsi docker run penting: volume, jaringan, variabel lingkungan, dan health check',
    'Menulis berkas docker-compose dengan healthcheck, restart policy, volume named, batas sumber daya, dan jaringan internal',
    'Menyusun pipeline GitHub Actions yang menjalankan pengujian integrasi Go dengan Redis sebagai service'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Memilih Image: redis:7-alpine vs redis:7</h3><p>Image resmi Redis tersedia dalam beberapa rasa, dan dua yang paling sering dipakai adalah <code>redis:7-alpine</code> dan <code>redis:7</code>. Keduanya menjalankan Redis versi yang sama persis; yang membedakan adalah sistem dasar yang ikut dibawa.</p><table><thead><tr><th>Sisi</th><th>redis:7-alpine</th><th>redis:7</th></tr></thead><tbody><tr><td><b>Basis sistem</b></td><td>Alpine Linux, sangat ringkas</td><td>Debian, perkakas sistem lengkap</td></tr><tr><td><b>Ukuran kira-kira</b></td><td>Puluhan megabita</td><td>Beberapa kali lebih besar</td></tr><tr><td><b>Perkakas bawaan</b></td><td>BusyBox: sedikit perintah, sudah cukup untuk <code>redis-cli</code></td><td><code>curl</code>, <code>procps</code>, dan utilitas Debian lain</td></tr><tr><td><b>Permukaan serangan</b></td><td>Lebih kecil, lebih sedikit paket yang perlu dipantau</td><td>Lebih luas, tetapi paket mudah diperbarui</td></tr><tr><td><b>Paling cocok untuk</b></td><td>Produksi, CI, dan lingkungan yang menjaga ukuran image</td><td>Sesi debugging yang butuh alat tambahan di dalam kontainer</td></tr></tbody></table><p>Praktik yang lazim: <b>alpine untuk jalur produksi dan pengujian</b>, varian besar hanya ketika kamu benar-benar perlu masuk kontainer dan memakai alat yang tidak tersedia. Keduanya sudah memuat <code>redis-cli</code>, jadi urusan pemeriksaan kesehatan tidak pernah jadi alasan memilih varian yang lebih berat.</p>'
    },
    {
      type: 'example',
      title: 'Opsi docker run yang Penting untuk Redis',
      lang: 'bash',
      output: false,
      code: `# 1) Siapkan jaringan dan volume khusus aplikasi
docker network create shop-net
docker volume create redis-data

# 2) Jalankan Redis 7: volume, jaringan, password, dan health check
docker run -d --name redis-7 \\
  --network shop-net \\
  -p 127.0.0.1:6379:6379 \\
  -v redis-data:/data \\
  -e REDIS_PASSWORD=ganti-dengan-kata-kunci-kuat \\
  --health-cmd 'redis-cli -a $REDIS_PASSWORD ping' \\
  --health-interval 10s \\
  --health-timeout 5s \\
  --health-retries 3 \\
  redis:7-alpine sh -c 'exec redis-server --requirepass $REDIS_PASSWORD --appendonly yes'

# 3) Amati status kesehatannya
docker ps --filter name=redis-7`,
      explain: [
        'Variabel <code>REDIS_PASSWORD</code> lewat <code>-e</code> disiapkan di dalam kontainer, lalu dibaca oleh <code>sh -c</code> saat menyetel <code>--requirepass</code> — password tidak perlu ditulis permanen di baris perintah server.',
        'Tanda kutip tunggal pada <code>--health-cmd</code> dan <code>sh -c</code> mencegah shell komputermu ikut mengeksplor <code>$REDIS_PASSWORD</code>; ekspansi terjadi di dalam kontainer tempat variabel itu benar-benar ada.',
        '<code>--health-cmd</code> dijalankan berkala sesuai interval; <code>docker ps</code> lalu menampilkan status <code>(healthy)</code> atau <code>(unhealthy)</code>, dan docker compose bisa menunggu status itu sebelum melanjutkan.',
        'Penjatahan <code>-v redis-data:/data</code> membuat data tetap hidup walau kontainer dibuang, sedangkan <code>-p 127.0.0.1:6379:6379</code> hanya membuka port pada mesin itu sendiri.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Persistensi: Kontainer Bukan Tempat Menaruh Data</h3><p>Kontainer dirancang untuk <b>singkat dan bisa dibuang</b>: dihapus, dibuat ulang, diganti versi tanpa rasa bersalah. Sifat itu bagus untuk perangkat lunak, tetapi berbahaya bila disalahartikan untuk data. Seluruh tulisan yang berada di luar <code>/data</code> hidup di lapisan kontainer yang akan ikut hilang saat kontainer dibuang.</p><p><b>Anti-pattern klasiknya:</b> menjalankan Redis tanpa volume sama sekali, lalu keheranan ketika database cache, sesi pengguna, dan kunci idempoten lenyap setelah <code>docker rm</code> atau setelah server di-restart. Varian kedua yang tak kalah sering: menaruh data di <i>bind mount</i> folder sementara milik pengembang, yang membuat hasil pengujian berbeda-beda antar mesin.</p><p>Resep yang benar sederhana: <b>volume named</b> yang menunjuk ke <code>/data</code>, ditambah <b>appendonly</b> agar setiap tulisan dicatat sebelum dianggap selesai. Volume named dikelola Docker sendiri, bisa dipindahkan antar mesin dengan <code>docker volume</code>, dan tidak lagi bergantung pada struktur folder sebuah host tertentu. Dengan begitu, membuang kontainer sama sekali tidak berarti membuang data.</p>'
    },
    {
      type: 'example',
      title: 'docker-compose Lengkap untuk Redis dan Aplikasinya',
      lang: 'yaml',
      output: false,
      code: `services:
  redis:
    image: redis:7-alpine
    container_name: redis-7
    restart: unless-stopped
    environment:
      REDIS_PASSWORD: ganti-dengan-kata-kunci-kuat
    command: sh -c 'exec redis-server --requirepass $$REDIS_PASSWORD --appendonly yes'
    volumes:
      - redis-data:/data
    networks:
      - internal
    healthcheck:
      test: ["CMD-SHELL", "redis-cli -a $$REDIS_PASSWORD ping | grep -q PONG"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 5s
    deploy:
      resources:
        limits:
          cpus: "0.50"
          memory: 256M

  api:
    build:
      context: .
      dockerfile: Dockerfile
    depends_on:
      redis:
        condition: service_healthy
    environment:
      REDIS_ADDR: redis://redis:6379
      REDIS_PASSWORD: ganti-dengan-kata-kunci-kuat
    ports:
      - "8080:8080"
    networks:
      - internal

volumes:
  redis-data:

networks:
  internal:
    internal: true`,
      explain: [
        'Tanda <code>$$</code> pada berkas compose adalah cara berkata "ini bukan interpolasi compose": docker compose mengubahnya menjadi <code>$</code> biasa lalu menyerahkannya ke shell kontainer, sehingga ekspansi variabel terjadi di tempat yang benar.',
        '<code>healthcheck</code> pada service redis membuat <code>depends_on: condition: service_healthy</code> pada service api benar-benar berarti: API baru mulai ketika Redis sudah menjawab PONG, bukan sekadar ketika kontainer baru dibuat.',
        '<code>deploy.resources.limits</code> menahan Redis agar tidak memakan seluruh RAM mesin; <code>restart: unless-stopped</code> menghidupkan kembali kontainer setelah crash atau reboot mesin.',
        'Jaringan <code>internal: true</code> mengurung komunikasi di antara kedua service tanpa akses keluar, dan Redis sengaja tidak mem-publish port ke host — cukup layanan <code>api</code> yang menemukannya lewat nama <code>redis</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Dockerfile Aplikasi Go Multi-Stage',
      lang: 'text',
      output: false,
      code: `# Tahap 1: bangun binary bersama seluruh toolchain
FROM golang:1.22-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /out/app ./cmd/api

# Tahap 2: image akhir tanpa toolchain, tanpa kode sumber
FROM alpine:3.20
RUN apk add --no-cache ca-certificates
COPY --from=build /out/app /usr/local/bin/app
EXPOSE 8080
ENTRYPOINT ["app"]`,
      explain: [
        'Multi-stage membuat image akhir hanya berisi binary dan sedikit runtime Alpine, bukan seluruh toolchain Go yang ratusan megabita — sekaligus kode sumber tidak ikut terbawa ke produksi.',
        'Perintah <code>COPY go.mod go.sum</code> dijalankan sebelum menyalin kode sumber agar lapisan <code>go mod download</code> tetap ter-caching selama daftar dependensi tidak berubah.',
        'Image ini dibangun oleh service <code>api</code> pada berkas compose sebelumnya dan otomatis terhubung ke jaringan <code>internal</code>, sehingga cukup menulis alamat <code>redis:6379</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Klien Go yang Bicara ke Redis di Jaringan Compose',
      lang: 'go',
      output: false,
      code: `package cache

import (
	"context"
	"os"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

// New membaca konfigurasi dari lingkungan; di compose alamatnya redis:6379.
func New() *redis.Client {
	addr := os.Getenv("REDIS_ADDR")
	if addr == "" {
		addr = "redis://localhost:6379"
	}
	return redis.NewClient(&redis.Options{
		Addr:     strings.TrimPrefix(addr, "redis://"),
		Password: os.Getenv("REDIS_PASSWORD"),
		DB:       0,
	})
}

// Ping dipakai sebagai pemeriksaan awal dan uji integrasi di CI.
func Ping(ctx context.Context, rdb *redis.Client) error {
	ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()
	return rdb.Ping(ctx).Err()
}`,
      explain: [
        'Alamat dibaca dari <code>REDIS_ADDR</code> sehingga kode yang sama berjalan di laptop (localhost), di compose (redis:6379), maupun di CI tanpa perubahan satu baris pun.',
        'Timeout dua detik pada <code>Ping</code> bukan hiasan: ketika Redis belum siap atau jaringan bermasalah, permintaan berhenti dengan cepat alih-alih menggantung dan menumpuk koneksi.',
        'Di CI, berkas workflow cukup menyetel <code>REDIS_ADDR</code> ke alamat service Redis dan pengujian integrasi langsung bisa memakai fungsi yang sama.'
      ]
    },
    {
      type: 'text',
      html: `<h3>Alur Integrasi Berkelanjutan dengan Redis</h3><p>Setiap kali kode diunggah, pipeline berjalan dari kiri ke kanan pada gambar: Redis tersedia sebagai pendamping job, pengujian berjalan, image dibangun, dan hanya build yang lulus yang berhak menerbitkan image baru.</p><figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 245" width="760" role="img" aria-label="Alur integrasi berkelanjutan: git push menuju GitHub Actions dengan service Redis, lalu pengujian, pembangunan image, dan penerbitan ke registry">
        <rect x="15" y="50" width="130" height="80" rx="10" class="u-box"/>
        <text x="80" y="80" class="u-title" text-anchor="middle">git push</text>
        <text x="80" y="102" class="u-lbl" text-anchor="middle">ke branch main</text>
        <text x="80" y="122" class="u-lbl" text-anchor="middle">atau pull request</text>

        <line x1="149" y1="90" x2="184" y2="90" class="u-line" marker-end="url(#u-arrow)"/>

        <rect x="190" y="50" width="145" height="80" rx="10" class="u-hl"/>
        <text x="262" y="78" class="u-title" text-anchor="middle">GitHub Actions</text>
        <text x="262" y="100" class="u-lbl" text-anchor="middle">services: redis</text>
        <text x="262" y="120" class="u-lbl" text-anchor="middle">redis:7-alpine</text>

        <line x1="339" y1="90" x2="374" y2="90" class="u-line" marker-end="url(#u-arrow)"/>

        <rect x="380" y="50" width="120" height="80" rx="10" class="u-box"/>
        <text x="440" y="80" class="u-title" text-anchor="middle">go test</text>
        <text x="440" y="102" class="u-lbl" text-anchor="middle">pengujian</text>
        <text x="440" y="122" class="u-lbl" text-anchor="middle">integrasi</text>

        <line x1="504" y1="90" x2="539" y2="90" class="u-line" marker-end="url(#u-arrow)"/>

        <rect x="545" y="50" width="110" height="80" rx="10" class="u-box"/>
        <text x="600" y="80" class="u-title" text-anchor="middle">docker build</text>
        <text x="600" y="102" class="u-lbl" text-anchor="middle">image versi</text>
        <text x="600" y="122" class="u-lbl" text-anchor="middle">baru</text>

        <line x1="659" y1="90" x2="694" y2="90" class="u-line" marker-end="url(#u-arrow)"/>

        <rect x="15" y="165" width="730" height="60" rx="10" class="u-box"/>
        <text x="380" y="191" class="u-title" text-anchor="middle">Registry (GHCR / Docker Hub)</text>
        <text x="380" y="214" class="u-lbl" text-anchor="middle">lulus uji → image diterbitkan · gagal uji → rilis diblokir sebelum sampai ke pengguna</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 14.1</b> — Alur CI dengan Redis sebagai service: setiap push memicu pengujian integrasi terhadap Redis sungguhan, lalu image dibangun dan diterbitkan</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Bagaimana Redis Muncul di Pipeline</h3><p>GitHub Actions menyediakan fitur bernama <b>services</b>: kontainer pendamping yang hidup selama job berlangsung. Redis tidak perlu dipasang manual, tidak perlu di-commit ke repo, dan tidak meninggalkan jejak setelah job selesai. Alurnya:</p><ul><li><b>Runner menarik image</b> <code>redis:7-alpine</code> lalu menjalankannya dengan opsi yang kamu tentukan, termasuk <i>health check</i>.</li><li><b>Job menunggu sehat</b> — seluruh <i>step</i> baru dimulai setelah kontainer service menjawab PONG, sehingga tidak ada pengujian yang berlari mendahului kesiapan Redis.</li><li><b>Langkah pengujian memakai alamat yang disetel lewat <code>env</code></b>, misalnya <code>REDIS_ADDR</code>, dan kode aplikasi tidak perlu tahu sedang berada di CI.</li><li><b>Setelah job selesai, service dibuang</b> — tiap run memperoleh Redis kosong yang bersih, jadi pengujian tidak pernah saling menanggalkan sisa data.</li></ul><p>Kunci kenyamanan lain adalah <b>cache</b>: <code>actions/setup-go</code> menyimpan modul dan hasil build antar run, sehingga run berikutnya tidak mengunduh ulang seluruh dependensi. Bagi proyek dengan ratusan modul, penghematan ini bisa memangkas menit penuh dari setiap pengujian.</p>'
    },
    {
      type: 'example',
      title: 'Pipeline GitHub Actions dengan Service Redis',
      lang: 'yaml',
      output: false,
      code: `name: go-ci
on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    env:
      REDIS_ADDR: redis://localhost:6379
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: "1.22"
          cache: true
      - name: Unduh dependensi
        run: go mod download
      - name: Pengujian integrasi
        run: go test -tags=integration ./... -v`,
      explain: [
        'Blok <code>services</code> menjalankan Redis sungguhan selama job; opsi <code>--health-cmd</code> memastikan runner tidak mulai menguji sebelum Redis menjawab PONG.',
        'Karena Redis di CI tidak memakai password, <code>redis-cli ping</code> sudah cukup; bila pengujianmu memang menguji jalur autentikasi, tambahkan password melalui rahasia CI, bukan tulisan tetap di berkas.',
        'Tag <code>-tags=integration</code> memisahkan pengujian yang butuh Redis dari pengujian unit biasa, sehingga developer tetap bisa menjalankan <code>go test</code> polos tanpa kegagalan koneksi.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Anti-Pattern CI yang Layak Dihindari</h3><p>Otomatisasi memang mempercepat kerja, tetapi juga mempercepat bencana bila salah konfigurasi. Dua anti-pattern berikut paling sering menimbulkan insiden yang membingungkan:</p><ul><li><b>Memakai Redis produksi untuk pengujian.</b> Pengujian yang menghapus pola key justru menghapus data pengguna sungguhan; pengujian yang menulis kunci sesi mengotori data produksi; dan pengujian beban yang berjalan semalaman membuat Redis asli kehabisan memori. Waktu pengujian juga bisa membajak kinerja produksi karena berbagi CPU dan jaringan yang sama. Aturannya tegas: <b>CI memakai Redis miliknya sendiri yang dibuat dan dibuang otomatis</b>.</li><li><b>Menanamkan password di log.</b> Baris seperti <code>echo PASSWORD=rahasia</code>, URL koneksi lengkap berisi kredensial, atau jejak HTTP yang memuat kata sandi akan hidup selamanya di arsip log dan mudah ditemukan siapa pun yang punya akses baca. Kredensial harus masuk lewat mekanisme rahasia CI lalu dipakai sebagai variabel lingkungan, dan kode harus menolak mencetak kredensial ke log.</li></ul><p>Ada pula dua kebiasaan kecil yang sering merusak kepercayaan pada pipeline: memakai tag <code>latest</code> sehingga hasil build tidak pernah bisa direproduksi, dan menulis pengujian yang menyimpan keadaan di Redis tanpa membersihkannya sehingga run berikutnya gagal tanpa sebab yang jelas. Keduanya sama-sama diselesaikan dengan disiplin: tag versi yang tetap, dan pengujian yang memakai pola key unik per run.</p>'
    },
    {
      type: 'tip',
      title: 'Tag Versi, Bukan Latest',
      text: 'Tetapkan tag image yang tetap, misalnya <code>redis:7.2-alpine</code>, lalu perbarui secara sadar. Dengan <code>latest</code>, build yang gagal hari ini bisa jadi lulus esok hari tanpa ada satu pun perubahan kode — dan kebalikannya, build yang selama ini lulus bisa tiba-tiba gagal karena image di belakang layar berganti.'
    },
    {
      type: 'warn',
      title: 'Sehat di Compose Bukan Berarti Selalu Ada',
      text: '<code>depends_on</code> dengan <code>condition: service_healthy</code> hanya menunda <b>awal</b> startup; setelah job berjalan, Redis tetap bisa crash, kehabisan memori, atau terputus jaringannya. Aplikasi tetap wajib menangani koneksi gagal dengan timeout, percobaan ulang terbatas, dan degradasi yang jujur kepada pengguna. Jangan biarkan satu blok konfigurasi compose memberi rasa aman palsu.'
    },
    {
      type: 'vocab',
      items: [
        ['Image Alpine', 'Varian image Docker berbasis Alpine Linux yang ringkas; contohnya redis:7-alpine, pilihan wajar untuk produksi dan CI.'],
        ['Named volume', 'Area penyimpanan yang dikelola Docker sendiri dan menempel pada path kontainer, misalnya /data, sehingga data tetap hidup saat kontainer dibuang.'],
        ['Health check', 'Perintah berkala yang menilai apakah kontainer benar-benar berfungsi; hasilnya berupa status starting, healthy, atau unhealthy.'],
        ['Jaringan internal', 'Network Docker yang mengurung service di antara sendiri tanpa akses keluar dan tanpa port yang dipublish ke luar.'],
        ['Multi-stage build', 'Teknik Dockerfile dengan beberapa tahap FROM agar image akhir hanya membawa hasil build, bukan seluruh toolchain.'],
        ['Service (CI)', 'Kontainer pendamping pada pipeline, misalnya Redis di GitHub Actions, yang hidup selama job berlangsung lalu dibuang.'],
        ['Anti-pattern CI', 'Kebiasaan merusak pada integrasi berkelanjutan, contohnya memakai Redis produksi untuk pengujian atau menanam kredensial di log.']
      ]
    }
  ],
  recap: [
    'redis:7-alpine ringkas dan menjadi pilihan produksi serta CI; redis:7 berbasis Debian lebih berat dan berguna saat perlu perkakas tambahan di dalam kontainer.',
    'Opsi docker run penting untuk Redis: volume pada /data, jaringan bersama, variabel lingkungan untuk password, dan health check yang mengecek PONG secara berkala.',
    'docker-compose lengkap memuat healthcheck, restart policy, volume named, batas sumber daya, dan jaringan internal; layanan lain cukup menunggu status service_healthy.',
    'CI menyediakan Redis lewat blok services pada GitHub Actions, memisahkan pengujian integrasi dengan tag build, dan menghindari anti-pattern: Redis produksi untuk test serta kredensial yang bocor ke log.'
  ]
});
