/* ============================================================
   Pelajaran Microservices — Bab 13: CI/CD Otomatis
   ============================================================ */
'use strict';

window.MICROSERVICE_LESSONS = window.MICROSERVICE_LESSONS || [];

window.MICROSERVICE_LESSONS.push({
  id: 'cicd-otomatis',
  title: 'CI/CD: Pipeline Otomatis dari Commit sampai Deploy',
  chapter: 'Infrastruktur & Observabilitas',
  duration: '12–14 menit',
  intro: [
    'Di monolit, rilis berarti membangun satu binary besar lalu menaruhnya di server. Di Order Management System kita ada tiga service dengan ritme rilis masing-masing — catalog-service bisa dirilis tiga kali sehari sementara order-service menunggu perubahan besar. Bila prosesnya manual, kemungkinan besar versi yang terdeploy di server dev bukan versi yang ada di branch main, dan "di laptop saya bisa" menjadi kalimat paling mahal di tim.',
    '<b>CI/CD (Continuous Integration / Continuous Deployment)</b> menghapus tebakan itu. Setiap pull request melewati jalur yang sama persis: format dicek, <code>go vet</code> dijalankan, unit test diuji, binary dan Docker image dibangun, lalu image dengan <b>tag git SHA</b> dideploy ke lingkungan dev dan diuji oleh smoke test. Tidak ada langkah yang "dilewati dulu karena buru-buru" — pipeline yang merah menghentikan penggabungan.',
    'Bab ini menyusun pipeline lengkap untuk catalog-service memakai GitHub Actions: mulai dari konvensi branch dan pull request, urutan job, pengelolaan secret, rolling deployment beserta rollback, hingga migration database yang tetap kompatibel antarversi lewat pola expand–contract.'
  ],
  objectives: [
    'Menjelaskan alur git branching dan pull request untuk tim microservices',
    'Menyusun urutan pipeline: format, vet, unit test, build binary, build image, deploy, smoke test',
    'Menulis workflow GitHub Actions lengkap dengan GitHub Secrets dan GitHub Packages',
    'Menerapkan pola expand–contract agar migration tetap kompatibel dengan versi lama',
    'Menjalankan rolling deployment dan rollback dengan cara yang aman'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Git Branching dan Pull Request</h3><p>Untuk monorepo dengan beberapa service, konvensi yang sederhana dan ketat bekerja paling baik: <b>main selalu siap deploy</b>, dan setiap perubahan masuk lewat pull request. Nama branch mengikuti pola <code>fitur/singkat-perubahan</code> atau <code>bugfix/singkat-perubahan</code>, misalnya <code>fitur/produk-stok</code>. Setelah review dan pipeline hijau, PR digabung ke main — bukan sebaliknya.</p><p>Lindungi branch main di pengaturan repository: larang push langsung, wajibkan minimal satu review, dan wajibkan status check pipeline lolos. Dengan begitu, tidak ada kode yang masuk tanpa melewati gerbang yang sama. Di monorepo, kamu bisa membatasi pipeline memakai <code>paths</code> — perubahan di <code>services/catalog/**</code> cukup memicu workflow catalog, tapi perubahan di <code>go.mod</code> memicu semuanya karena berdampak ke semua service.</p>'
    },
    {
      type: 'text',
      html: '<h3>Anatomi Pipeline</h3><p>Urutan tahap di bawah ini bukan kebetulan — yang paling murah didahulukan agar kegagalan tertangkap lebih awal dan runner tidak membuang waktu membangun image yang pasti gagal test.</p><table><thead><tr><th>Urutan</th><th>Tahap</th><th>Perintah inti</th><th>Saat gagal</th></tr></thead><tbody><tr><td>1</td><td>Cek format</td><td><code>gofmt -l .</code></td><td>Kode belum diformat; perbaiki lokal</td></tr><tr><td>2</td><td>Static analysis</td><td><code>go vet ./...</code></td><td>Ada kode mencurigakan (unused variable, salah printf)</td></tr><tr><td>3</td><td>Unit test</td><td><code>go test -race ./...</code></td><td>Ada test merah atau data race</td></tr><tr><td>4</td><td>Build binary</td><td><code>go build ./services/catalog</code></td><td>Kode gagal dikompilasi</td></tr><tr><td>5</td><td>Build &amp; push image</td><td><code>docker/build-push-action</code></td><td>Dockerfile rusak atau registry ditolak</td></tr><tr><td>6</td><td>Deploy dev</td><td><code>kubectl set image ...</code></td><td>Pod tidak pernah ready; rollout timeout</td></tr><tr><td>7</td><td>Smoke test</td><td><code>curl /healthz</code> + skrip singkat</td><td>Endpoint sehat tapi perilaku rusak</td></tr></tbody></table><p>Tahap 1–4 berjalan di setiap pull request. Tahap 5–7 hanya berjalan setelah PR digabung ke main, karena menyentuh registry dan lingkungan dev. Pemisahan ini menjaga PR tetap cepat tanpa mengorbankan verifikasi penuh di main.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Workflow GitHub Actions lengkap untuk catalog-service',
      lang: 'yaml',
      output: false,
      code: `name: catalog-service

on:
  pull_request:
    branches: [main]
    paths: ['services/catalog/**', 'go.mod', 'go.sum', '.github/workflows/catalog.yml']
  push:
    branches: [main]
    paths: ['services/catalog/**', 'go.mod', 'go.sum', '.github/workflows/catalog.yml']

env:
  SERVICE: catalog
  IMAGE: ghcr.io/example/oms-catalog
  REGISTRY: ghcr.io

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Pasang Go sesuai go.mod
        uses: actions/setup-go@v5
        with:
          go-version-file: go.mod
          cache: true

      - name: Cek format (gofmt)
        run: |
          unformatted=$(gofmt -l .)
          if [ -n "$unformatted" ]; then
            echo "File berikut belum diformat:"
            echo "$unformatted"
            echo "Jalankan: gofmt -w ."
            exit 1
          fi

      - name: Vet
        run: go vet ./...

      - name: Unit test dengan race detector
        run: go test -race -coverprofile=coverage.out ./services/catalog/...

      - name: Build binary (memastikan terkompilasi)
        run: CGO_ENABLED=0 go build -o /tmp/catalog ./services/catalog

  build:
    needs: verify
    if: github.event_name == 'push'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    outputs:
      image: \${{ steps.meta.outputs.image }}
    steps:
      - uses: actions/checkout@v4

      - name: Susun tag image dari git SHA
        id: meta
        run: echo "image=$IMAGE:$GITHUB_SHA" >> "$GITHUB_OUTPUT"

      - name: Login ke registry
        uses: docker/login-action@v3
        with:
          registry: \${{ env.REGISTRY }}
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}

      - name: Build dan push
        uses: docker/build-push-action@v6
        with:
          context: services/catalog
          push: true
          tags: \${{ steps.meta.outputs.image }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-dev:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Siapkan kubeconfig
        env:
          KUBE_CONFIG: \${{ secrets.KUBE_CONFIG_DEV }}
        run: |
          mkdir -p "$HOME/.kube"
          printf '%s' "$KUBE_CONFIG" > "$HOME/.kube/config"

      - name: Rolling update deploy/catalog
        run: |
          kubectl -n oms-dev set image deploy/catalog catalog=\${{ needs.build.outputs.image }}
          kubectl -n oms-dev rollout status deploy/catalog --timeout=180s

  smoke-test:
    needs: deploy-dev
    runs-on: ubuntu-latest
    steps:
      - name: Cek health endpoint sampai sehat
        run: |
          url="http://dev.example.com/healthz"
          for i in 1 2 3 4 5 6; do
            code=$(curl -s -o /dev/null -w '%{http_code}' "$url" || true)
            echo "percobaan $i: HTTP $code"
            if [ "$code" = "200" ]; then exit 0; fi
            sleep 5
          done
          echo "healthz tidak pernah 200"
          exit 1`,
      explain: [
        'Blok <code>paths</code> membuat workflow hanya terpicu saat file catalog, <code>go.mod</code>, atau workflow itu sendiri berubah — hemat runner dan umpan balik lebih cepat.',
        '<code>actions/setup-go@v5</code> membaca versi dari <code>go.mod</code> sehingga Go di CI selalu sama dengan yang dipakai tim; <code>cache: true</code> menyimpan modul dan build cache antar run.',
        'Tag image memakai <b>git SHA penuh</b> — setiap image dapat ditelusuri ke commit persis yang membangunnya. <code>secrets.GITHUB_TOKEN</code> adalah token bawaan untuk login ke GitHub Packages sehingga tidak perlu membuat token manual.',
        'Job <code>deploy-dev</code> memakai <code>kubectl rollout status</code> sebagai gerbang: bila Pod baru tidak pernah ready dalam 180 detik, job gagal dan <code>smoke-test</code> tidak berjalan.',
        'Smoke test mencoba berulang karena beberapa detik pertama setelah rollout, ingress mungkin masih memperbarui backend. Enam percobaan dengan jeda 5 detik memberi napas tanpa menutupi masalah nyata.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh: Smoke test manual dengan curl',
      lang: 'bash',
      output: false,
      code: `BASE=http://dev.example.com

# 1. Health check: service hidup dan menjawab
curl -s -i "$BASE/healthz"

# 2. Readiness: service siap menerima trafik (DB sudah terhubung)
curl -s -i "$BASE/readyz"

# 3. Smoke test perilaku: buat produk lalu baca kembali
curl -s -X POST "$BASE/products" \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer $TOKEN' \\
  -d '{"name":"Sepatu Lari","price":499000,"stock":10}'

curl -s "$BASE/products/1" | jq .`,
      explain: [
        'Urutan yang benar: <code>/healthz</code> dulu (apakah proses hidup?), baru <code>/readyz</code> (apakah siap melayani?), baru tes perilaku bisnis. Gagal di tahap awal menghematmu dari membaca error yang membingungkan.',
        'Smoke test bukan pengganti unit test — ia memverifikasi jalur nyata: DNS ingress, TLS, routing ke Pod, koneksi database, dan respons JSON.',
        'Simpan skrip ini sebagai <code>scripts/smoke.sh</code> agar pipeline dan manusia memakai jalur pemeriksaan yang sama.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Secret Management di Pipeline</h3><p>Secret seperti kata sandi database, token registry, dan kubeconfig tidak boleh pernah menyentuh repository. Di GitHub Actions tempatnya adalah <b>Settings → Secrets and variables → Actions</b>: nilai disimpan terenkripsi dan hanya muncul sebagai <code>${{ secrets.NAMA }}</code> yang otomatis disensor di log. Kredensial registry sebaiknya tidak perlu dibuat sama sekali — <code>GITHUB_TOKEN</code> bawaan cukup untuk mendorong image ke GitHub Packages dan kedaluwarsa otomatis setiap job selesai.</p><p>Dua kebiasaan yang wajib dibiasakan: <b>jangan pernah echo secret ke log</b> (termasuk saat debugging), dan <b>rotasi berkala</b> bila ada kecurigaan bocor. Untuk skala lebih besar, pertimbangkan <b>OIDC</b> — alih-alih menyimpan kredensial statis di GitHub, pipeline meminta token jangka pendek langsung ke penyedia cloud dengan identitas berbasis <code>repo + branch</code>. Kubeconfig di contoh sebelumnya juga sebaiknya dipindahkan ke pola serupa begitu infrastrukturmu mendukungnya.</p>'
    },
    {
      type: 'text',
      html: '<h3>Rolling Deployment dan Rollback</h3><p>Deploy yang baik tidak pernah membuat downtime: itulah <b>rolling update</b> — Kubernetes membuat Pod baru, menunggunya ready, lalu mematikan Pod lama satu per satu. Karena image setiap deploy ditandai git SHA, rollback bukan hal istimewa: tinggal arahkan Deployment ke SHA lama yang sudah terbukti sehat. Inilah alasan pentingnya tidak memakai tag <code>latest</code> — tidak ada yang bisa diputar balik bila tagnya berubah diam-diam.</p>',
    },
    {
      type: 'example',
      title: 'Contoh: Rollback dengan kubectl',
      lang: 'bash',
      output: false,
      code: `# Deploy manual dengan image tertentu (misal hasil SHA sebelumnya)
kubectl -n oms-dev set image deploy/catalog \\
  catalog=ghcr.io/example/oms-catalog:3f9a1c2e7b5d...

# Pantau rollout: berapa Pod lama tersisa, apakah Pod baru ready
kubectl -n oms-dev rollout status deploy/catalog
kubectl -n oms-dev get pods -l app=catalog -o wide

# Gagal? Putar balik ke revisi sebelumnya — satu perintah
kubectl -n oms-dev rollout undo deploy/catalog

# Lihat riwayat revisi untuk tahu persis ke mana rollback mengarah
kubectl -n oms-dev rollout history deploy/catalog`,
      explain: [
        '<code>rollout status</code> menahan sampai semua Pod baru ready atau timeout — inilah gerbang yang dipakai pipeline.',
        '<code>rollout undo</code> mengembalikan pod template ke revisi sebelumnya di Deployment; aman karena bersifat deklaratif dan tercatat di riwayat.',
        'Untuk rollback karena bug perilaku (bukan crash), rollback otomatis tidak cukup — migrasikan trafik pelan-pelan dan umumkan ke tim, terutama bila menyangkut skema database.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Database Migration yang Kompatibel: Expand–Contract</h3><p>Di monolit, aplikasi dan database dirilis bersamaan sehingga migration bisa langsung mengganti skema. Di microservices, dua versi pod bisa berjalan bersamaan selama rolling update — dan bila migration menghapus kolom lama saat separuh pod masih memakainya, setengah trafik langsung rusak. <b>Expand–contract</b> memecah perubahan skema menjadi tahap yang selalu aman untuk kedua versi:</p><table><thead><tr><th>Fase</th><th>Tindakan</th><th>Kode lama</th><th>Kode baru</th></tr></thead><tbody><tr><td><b>1. Expand</b></td><td>Tambah kolom/tabel baru (nullable atau dengan default)</td><td>aman, mengabaikan kolom baru</td><td>mulai menulis kolom baru</td></tr><tr><td><b>2. Migrate</b></td><td>Backfill data lama ke kolom baru</td><td>aman</td><td>baca kolom baru</td></tr><tr><td><b>3. Switch</b></td><td>Rilis kode yang hanya membaca kolom baru</td><td>tidak berjalan lagi</td><td>aktif</td></tr><tr><td><b>4. Contract</b></td><td>Hapus kolom lama setelah semua pod versi lama hilang</td><td>—</td><td>bersih</td></tr></tbody></table><p>Aturan praktisnya: satu PR untuk migration, PR berikutnya untuk kode yang memakai hasil migration, dan penghapusan skema hanya setelah dipastikan tidak ada versi lama yang berjalan. Jalankan migration sebagai <b>langkah terpisah sebelum deploy kode</b>, bukan otomatis saat aplikasi start — supaya kegagalannya terlihat jelas dan tidak menggulirkan ratusan pod sekaligus.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Migration expand–contract untuk orders',
      lang: 'sql',
      output: false,
      code: `-- FASE 1 (expand): tambah kolom baru tanpa menyentuh yang lama
ALTER TABLE orders ADD COLUMN total_amount numeric(14,2);
ALTER TABLE orders ADD COLUMN currency char(3);

-- FASE 2 (migrate): backfill dari kolom lama (sekali jalan, batch kecil)
UPDATE orders SET total_amount = amount, currency = 'IDR'
WHERE total_amount IS NULL;

-- FASE 3 (switch): kode baru sudah membaca total_amount;
-- tunggu semua pod versi lama berakhir, lalu...
-- FASE 4 (contract): hapus kolom lama
ALTER TABLE orders DROP COLUMN amount;`,
      explain: [
        'Fase 1 dan 2 boleh digabung dalam satu rilis karena keduanya tidak merusak kode lama.',
        'Backfill besar sebaiknya dijalankan per batch (misal <code>LIMIT 1000</code> dalam loop) agar tidak mengunci tabel lama dan memenuhi WAL.',
        'Fase 4 dilakukan paling cepat satu rilis setelah fase 3 — beri jaring pengaman waktu, bukan asumsi.'
      ]
    },
    {
      type: 'tip',
      title: 'Latihan',
      text: '<p>Buat workflow <code>.github/workflows/catalog.yml</code> di monorepo OMS-mu sendiri lalu uji tiga skenario: (1) push dengan kode yang sengaja tidak diformat — pastikan job verify merah dan PR tidak bisa digabung; (2) perbaiki format lalu merge — pastikan image baru terbit di registry dengan tag SHA commit-mu; (3) rusak health check sementara (misal matikan database) dan jalankan ulang deploy-dev — amati <code>rollout status</code> timeout dan smoke test gagal. Setelah itu latih rollback: catat SHA image sehat sebelum deploy, lalu jalankan <code>kubectl rollout undo</code> dan pastikan pod kembali ke versi lama.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Continuous Integration', 'Kebiasaan menggabungkan perubahan ke main sering-sering dengan verifikasi otomatis di setiap pull request.'],
        ['Pull Request', 'Permintaan menggabungkan branch ke main; menjadi tempat review dan gerbang pipeline.'],
        ['Git SHA', 'ID unik commit; dipakai sebagai tag image agar setiap rilis dapat ditelusuri ke kode persisnya.'],
        ['Smoke test', 'Pengujian singkat setelah deploy untuk memastikan service hidup dan berperilaku benar di lingkungan nyata.'],
        ['Secret', 'Nilai sensitif yang disimpan terenkripsi di CI, bukan di repository; contohnya KUBE_CONFIG_DEV.'],
        ['Rolling update', 'Strategi deploy tanpa downtime: pod baru ready lebih dahulu sebelum pod lama dihentikan.'],
        ['Expand–contract', 'Pola migration bertahap agar skema database selalu kompatibel dengan dua versi kode sekaligus.']
      ]
    }
  ],
  recap: [
    'Main selalu siap deploy: setiap perubahan masuk lewat pull request dengan minimal satu review dan pipeline hijau.',
    'Pipeline menyusun tahap termurah lebih dulu: gofmt -l, go vet, go test -race, go build, lalu build dan push Docker image bertag git SHA.',
    'Secret disimpan di GitHub Secrets; GITHUB_TOKEN bawaan dipakai untuk registry sehingga tidak ada token statis di repository.',
    'Rolling update plus kubectl rollout status membuat deploy tanpa downtime, dan kubectl rollout undo mengembalikan versi sehat dalam satu perintah.',
    'Migration database memakai pola expand–contract: tambah dulu, backfill, pindah baca, dan hapus setelah versi lama pasti sudah tidak berjalan.'
  ]
});
