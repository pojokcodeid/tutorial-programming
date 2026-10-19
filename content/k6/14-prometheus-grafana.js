/* ============================================================
   Pelajaran Grafana k6 — Bab 14: Prometheus & Grafana
   ============================================================ */
'use strict';

window.K6_LESSONS = window.K6_LESSONS || [];

window.K6_LESSONS.push({
  id: 'prometheus-grafana',
  title: 'Melihat Beban Hidup di Prometheus &amp; Grafana',
  chapter: 'Hasil & Observability',
  duration: '9–11 menit',
  intro: [
    'Ringkasan terminal muncul sekali di akhir tes dan hilang begitu sesi tertutup. Saat kamu butuh melihat beban berjalan — membandingkan dua run, mencari titik melambat, atau memantau tes dari layar bersama tim — arsitektur standarnya adalah: k6 mengirim metrik ke <b>Prometheus</b>, lalu <b>Grafana</b> menggambarnya.',
    'k6 modern mengirim metrik lewat opsi <code>experimental-prometheus-rw</code> dari ekstensi resmi Grafana (<code>xk6-output-prometheus-remote</code>) yang memakai jalur <i>Prometheus remote write</i>: metrik didorong dari k6 ke Prometheus tanpa perlu Prometheus mengambil dari k6. Alternatif lain tersedia, mulai dari analisis file JSON sampai layanan terkelola Grafana Cloud k6.',
    'Bab ini membahas memilih kanal output, memasang remote write beserta provisioning Prometheus dan Grafana, menulis query PromQL untuk membaca dashboard k6, serta menjaga agar data tetap ringan dan bermakna — termasuk jebakan cardinalitas label dan sinkronisasi waktu.'
  ],
  objectives: [
    'Memilih kanal output k6 (file, remote write, Grafana Cloud) sesuai kebutuhan',
    'Memasang ekstensi remote write dan menautkannya dengan Prometheus serta Grafana',
    'Menulis query PromQL inti: VU, throughput, latensi p95, error rate, dan metrik bisnis',
    'Menjaga data tetap ringan: cardinalitas label, sinkronisasi waktu, dan metrik server'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Kenapa Dashboard, dan Kanal Mana yang Dipilih?</h3><p>Saat tes berjalan, angka berubah tiap detik: VU naik turun, latensi merangkak, error menjalar. Dashboard membuat perubahan itu terlihat sebagai kurva, sehingga kamu bisa menjawab pertanyaan yang mustahil dijawab ringkasan akhir — <i>kapan</i> mulai melambat, <i>seberapa cepat</i> error menyebar, dan <i>apa yang berubah</i> setelah deploy terakhir. Pilih kanalnya sesuai situasi:</p><figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 720 150" width="720" role="img" aria-label="Alur k6 mendorong metrik ke Prometheus lewat remote write lalu Grafana membacanya sebagai dashboard"><rect x="20" y="30" width="150" height="58" rx="10" class="u-hd"/><text x="95" y="55" class="u-title" text-anchor="middle">k6 run</text><text x="95" y="76" class="u-lbl" text-anchor="middle">-o experimental-prometheus-rw</text><line x1="170" y1="59" x2="240" y2="59" class="u-line" marker-end="url(#u-arrow)"/><text x="205" y="46" class="u-lbl" text-anchor="middle">remote write</text><rect x="245" y="30" width="150" height="58" rx="10" class="u-box"/><text x="320" y="55" class="u-title" text-anchor="middle">Prometheus</text><text x="320" y="76" class="u-lbl" text-anchor="middle">TSDB + PromQL</text><line x1="395" y1="59" x2="465" y2="59" class="u-line" marker-end="url(#u-arrow)"/><text x="430" y="46" class="u-lbl" text-anchor="middle">query</text><rect x="470" y="30" width="230" height="58" rx="10" class="u-box"/><text x="585" y="55" class="u-title" text-anchor="middle">Grafana</text><text x="585" y="76" class="u-lbl" text-anchor="middle">dashboard k6 + metrik aplikasi</text><rect x="20" y="102" width="425" height="42" rx="10" class="u-hd"/><text x="232" y="128" class="u-title" text-anchor="middle">alternatif: --out json / csv untuk analisis offline di CI</text><rect x="470" y="102" width="230" height="42" rx="10" class="u-hd"/><text x="585" y="128" class="u-title" text-anchor="middle">Grafana Cloud k6 (tanpa infra)</text></svg></div><figcaption class="fig-cap"><b>Gambar 14.1</b> — Alur standar: k6 mendorong metrik, Prometheus menyimpan, Grafana menggambarkan</figcaption></figure><table><thead><tr><th>Kanal</th><th>Cocok untuk</th><th>Catatan</th></tr></thead><tbody><tr><td><code>--out json / csv</code></td><td>Analisis offline, artefak CI</td><td>Tanpa infrastruktur, tetapi tidak real-time</td></tr><tr><td><code>experimental-prometheus-rw</code></td><td>Dashboard live di Prometheus + Grafana</td><td>Butuh server Prometheus; jalur resmi Grafana</td></tr><tr><td>Grafana Cloud k6</td><td>Tim tanpa infra monitoring sendiri</td><td>Hasil otomatis terlihat di akun cloud-mu</td></tr><tr><td>Integrasi lain (InfluxDB, TimescaleDB, dsb.)</td><td>Instalasi yang sudah ada di kantor</td><td>Lewat <code>--out</code> masing-masing ekstensi; cek dokumentasi resmi versimu</td></tr></tbody></table><p>Untuk sisa bab ini kita memakai jalur Prometheus + Grafana karena paling umum dan paling mudah dipelajari.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Memasang remote write dan menjalankan tes',
      lang: 'bash',
      output: false,
      code: `# 1) Bangun binary k6 bermuatan ekstensi (sekali saja; nama repo bisa berubah — cek dokumentasi resmi)
xk6 build --with github.com/grafana/xk6-output-prometheus-rw

# 2) Arahkan k6 ke endpoint remote write Prometheus milikmu
export K6_PROMETHEUS_RW_SERVER_URL=http://localhost:9090/api/v1/write

# 3) Pilih statistik trend yang disimpan (bawaan ekstensi: p99)
export K6_PROMETHEUS_RW_TREND_STATS=avg,p(95),p(99)

# 4) Label tambahan yang otomatis menempel pada tiap sampel
export K6_PROMETHEUS_RW_LABELS=team=perf,env=staging

# 5) Jalankan tes; run_id & testid menjadi label untuk menyaring hasil
./k6 run -o experimental-prometheus-rw --tag run_id=abc123 --tag testid=checkout scenarios/checkout.js`,
      explain: [
        'Ekstensi resmi Grafana kini bernama <code>github.com/grafana/xk6-output-prometheus-remote</code>; perintah <code>xk6 build --with ...</code> menghasilkan binary k6 yang sudah memuatnya. Nama modul dan flag bisa berubah antarversi — selalu cek dokumentasi resmi versimu.',
        '<code>-o experimental-prometheus-rw</code> mengaktifkan output remote write. Server tujuan diatur lewat <code>K6_PROMETHEUS_RW_SERVER_URL</code> yang menunjuk ke jalur <code>/api/v1/write</code> Prometheus.',
        '<code>K6_PROMETHEUS_RW_TREND_STATS</code> menentukan statistik mana dari Trend (Counter juga ikut sebagai <code>_total</code>) yang dikirim — bawaannya p99. Mencantumkan <code>avg,p(95),p(99)</code> menghasilkan beberapa gauge per metrik durasi; makin banyak statistik, makin banyak seri yang disimpan.',
        '<code>--tag</code> menempel pada seluruh sampel dan menjadi label Prometheus — <code>testid</code> dipakai dashboard k6 bawaan untuk memisahkan antar tes. Ada juga <code>K6_PROMETHEUS_RW_PUSH_INTERVAL</code> (interval dorong) dan <code>K6_PROMETHEUS_RW_STALE_MARKERS</code> (penanda serie basi) yang bisa disetel — kuncinya bisa berbeda antarversi.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh: Konfigurasi Prometheus dan provisioning datasource Grafana',
      lang: 'yaml',
      output: false,
      code: `# prometheus.yml — Prometheus menerima remote write dari k6
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

remote_write:
  - url: 'http://localhost:9090/api/v1/write'

---
# grafana/provisioning/datasources/prometheus.yml
apiVersion: 1

datasources:
  - name: Prometheus
    type: Prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false`,
      explain: [
        'Agar k6 bisa mendorong metrik, Prometheus harus mengaktifkan <code>remote_write</code> dengan jalur <code>/api/v1/write</code> (jalur bawaan; untuk distribusi lain bisa berbeda — cek dokumentasi resmi versimu).',
        'Blok <code>scrape_configs</code> tetap diperlukan agar Prometheus mengawasi dirinya sendiri dan target lain; metrik k6 tidak lewat sini karena didorong langsung oleh k6.',
        'File <i>provisioning</i> membuat datasource Prometheus muncul otomatis di Grafana tanpa klik manual — cocok untuk lingkungan yang dibangun ulang dari kode (infra-as-code).',
        'Setelah datasource siap, impor dashboard k6 dari komunitas: buka <b>Grafana → Dashboards → Import</b>, masukkan ID <b>19665</b> (k6 Load Testing Results) atau <b>18030</b> (k6 Lightweight), lalu pilih datasource Prometheus milikmu. ID dan isi dashboard bisa berubah antarversi — cocokkan dengan dokumentasi resmi.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Membaca Dashboard dengan PromQL</h3><p>Di balik tiap panel dashboard k6 ada query PromQL. Memahaminya membuat kamu bebas mengubah panel, membuat panel sendiri, dan yang paling penting — tahu apa yang sebenarnya diukur. Query inti yang biasanya muncul:</p><table><thead><tr><th>Query</th><th>Makna</th></tr></thead><tbody><tr><td><code>k6_vus</code></td><td>Jumlah VU aktif saat ini (gauge) — cocok dipasangkan dengan panel latensi untuk melihat fase ramp</td></tr><tr><td><code>rate(k6_http_reqs_total[1m])</code></td><td>Throughput: request per detik dari counter yang terus naik</td></tr><tr><td><code>histogram_quantile(0.95, sum by (le, scenario) (rate(k6_http_req_duration_seconds_bucket[1m])))</code></td><td>Latensi p95 dari native histogram, dipecah per skenario</td></tr><tr><td><code>1 - sum(rate(k6_http_req_failed_total[1m])) / sum(rate(k6_http_reqs_total[1m]))</code></td><td>Rasio request sukses terhadap total</td></tr><tr><td><code>k6_custom_business_errors</code></td><td>Contoh Counter buatan (misalnya <code>business_errors</code>) yang kamu tambahkan di skrip</td></tr></tbody></table><p><b>Penting:</b> bentuk nama metrik mengikuti cara pengiriman. Ekstensi remote write mengekspor durasi sebagai beberapa gauge bertag statistik — misalnya <code>k6_http_req_duration_p95</code> — dan kegagalan juga tampil sebagai gauge <code>k6_http_req_failed_rate</code>, jadi keduanya dibaca langsung tanpa <code>rate()</code>. Bila kamu mengaktifkan native histogram (opsi ekstensi; namanya bisa berubah antarversi — cek dokumentasi resmi versimu), durasi menjadi satu histogram bernama <code>k6_http_req_duration_seconds_bucket</code> seperti query ketiga. Counter selalu berakhiran <code>_total</code> karena Prometheus menambahkannya sendiri.</p><p>Supaya dashboard benar-benar berguna, lengkapi tiga hal: <b>variabel</b> (misalnya <code>$testid</code> untuk memilih tes dan <code>$scenario</code> untuk memilih skenario, diisi otomatis dari label), <b>annotation</b> (garis penanda di grafik untuk event seperti deploy — misalnya query yang mencari label <code>env</code>, dan bisa juga diarahkan ke Loki bila tim menyimpan log di sana), serta <b>timezone</b> panel yang disamakan dengan timezone tim agar bacaan waktu tidak ambigu. Terakhir, pasang panel <b>metrik aplikasi</b> (CPU, memori, koneksi database) di dashboard yang sama — beban dari k6 baru bermakna bila dibaca bersama beban server.'
    },
    {
      type: 'example',
      title: 'Contoh: Menjaga cardinalitas label tetap rendah',
      lang: 'javascript',
      output: false,
      code: `import { Counter } from 'k6';

const errors = new Counter('business_errors');

export default function () {
  // JANGAN: request_id unik tiap iterasi membuat seri Prometheus meledak
  errors.add(1, { endpoint: '/checkout', request_id: 'r-' + (__VU * 1000000 + __ITER) });

  // BAIK: hanya label dengan nilai terbatas dan bermakna untuk agregasi
  errors.add(1, { endpoint: '/checkout', reason: 'stok_habis' });
}`,
      explain: [
        'Setiap kombinasi label membentuk satu <b>seri</b> tersimpan di TSDB. <code>request_id</code> yang unik tiap iterasi menghasilkan jutaan seri — Prometheus melambat, memori membengkak, dan query menjadi lambat. Ini disebut ledakan <b>cardinality</b>.',
        'Label yang baik hanya memuat nilai dari kumpulan kecil dan tetap: nama endpoint, skenario, alasan kegagalan, region. Identitas unik seperti ID pengguna, nomor pesanan, atau timestamp sebaiknya tidak pernah jadi label.',
        'Counter buatan diekspor oleh ekstensi dengan prefiks <code>k6_custom_</code>, sehingga <code>business_errors</code> menjadi <code>k6_custom_business_errors</code> — siap dipakai di panel seperti pada tabel PromQL sebelumnya.',
        'Rambu dini yang bisa kamu pantau: jumlah seri di Prometheus (halaman <b>Status → Targets / TSDB Status</b>) melonjak drastis walau jumlah VU tetap. Bila itu terjadi, audit label di skrip sebelum menambah retention.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh: Studi kasus membaca dashboard saat tes berjalan',
      lang: 'text',
      output: false,
      code: `Menit 0–3 (ramp-up)
  k6_vus naik bertahap 0 → 50           → wajar, latensi masih datar
  rate(k6_http_reqs_total[1m]) ikut naik proporsional dengan VU

Menit 4 (steady state tiba)
  k6_vus datar di 50, tetapi p95 latensi merangkak 250ms → 600ms
  → throughput justru turun: kemacetan di sisi server, bukan di k6

Menit 5
  k6_http_req_failed_rate melonjak ke 4%
  cek panel metrik aplikasi di dashboard yang sama:
  connection pool database penuh, CPU mendekati 100%

Kesimpulan
  Batas aman aplikasi ≈ 50 VU / sekitar X req per detik pada p95 250ms.
  Angka itu jadi acuan kapasitas dan bahan perbaikan (pool, query, cache).`,
      explain: [
        'Pola baca yang umum: cocokkan <b>k6_vus</b> dengan <b>latensi</b> dan <b>throughput</b>. Bila VU datar tetapi latensi naik dan throughput turun, kemacetannya ada di aplikasi — bukan di penambahan beban k6.',
        'Selalu turunkan ke metrik pendukung sebelum menyimpulkan: error rate, panel CPU/memori aplikasi, dan koneksi database pada datasource yang sama. Satu kenaikan p95 punya banyak tersangka.',
        'Tandai momen-momen penting dengan <i>annotation</i> (deploy, perubahan konfigurasi) supaya kecocokan waktu antara perubahan dan perubahan kurva terlihat jelas.',
        'Simpan hasil tes yang mewakili kapasitas sebagai <b>baseline</b> (bab sebelumnya) dan bandingkan run berikutnya memakai filter <code>run_id</code> atau <code>testid</code> yang sama di variabel dashboard.'
      ]
    },
    {
      type: 'tip',
      title: 'Tips Satu Layar untuk Satu Keputusan',
      text: 'Satu dashboard yang padat dan jelas lebih berguna daripada sepuluh panel yang jarang dibuka. Kelompokkan menurut pertanyaan: <b>beban</b> (VU, throughput), <b>kinerja</b> (latensi per endpoint), <b>kegagalan</b> (error rate, metrik bisnis), dan <b>server</b> (CPU, memori, database) — lalu letakkan variabel <code>testid</code> dan <code>scenario</code> di atas agar satu tes mudah dipilih ulang saat review.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Dua jebakan paling sering merusak analisis. <b>Pertama, waktu:</b> bila mesin pengujian, Prometheus, dan Grafana tidak disinkronkan NTP, garis-garis di grafik bergeser dan kamu bisa salah menyalahkan faktor yang tidak bersalah — samakan timezone panel juga. <b>Kedua, lingkup:</b> dashboard k6 hanya menampilkan apa yang dikirim k6; tanpa metrik server (CPU, memori, database) kamu baru mengerjakan setengah analisis — tugas berikutnya adalah mencari sebab, dan sebabnya jarang ada di skrip tes.'
    },
    {
      type: 'vocab',
      items: [
        ['Prometheus', 'Sistem pemantauan dan time series database (TSDB) yang menyimpan metrik berlabel dan menjawabnya dengan query PromQL.'],
        ['Remote write', 'Jalur pengiriman metrik dari penghasil (k6) ke Prometheus melalui HTTP, tanpa perlu Prometheus mengambil (scrape) data.'],
        ['PromQL', 'Bahasa query Prometheus untuk mengolah time series, misalnya menghitung persentil dari histogram atau laju dari counter.'],
        ['Label', 'Pasangan kunci–nilai pada sebuah sampel yang dipakai membedakan seri, misalnya testid=checkout atau env=staging.'],
        ['Cardinality', 'Jumlah seri unik yang harus disimpan; meledak bila label memuat nilai unik seperti ID pengguna atau timestamp.'],
        ['Native histogram', 'Tipe metrik yang menyimpan distribusi latensi dalam satu seri (buckety), bukan beberapa gauge persentil terpisah.'],
        ['Annotation', 'Penanda berupa garis atau catatan pada panel Grafana untuk menandai event seperti deploy.'],
        ['Datasource provisioning', 'Cara menyiapkan datasource Grafana lewat file konfigurasi sehingga lingkungan bisa dibangun ulang otomatis dari kode.']
      ]
    }
  ],
  recap: [
    'k6 modern mengirim metrik ke Prometheus lewat ekstensi resmi dengan -o experimental-prometheus-rw; alternatifnya file JSON/CSV untuk analisis offline atau Grafana Cloud k6 tanpa infra sendiri.',
    'Konfigurasi dasar: Prometheus mengaktifkan remote_write, Grafana mendapat datasource Prometheus (idealnya lewat provisioning), lalu dashboard k6 diimpor dari ID 19665 atau 18030.',
    'Query inti dashboard: k6_vus untuk beban aktif, rate(k6_http_reqs_total[1m]) untuk throughput, histogram_quantile untuk latensi, dan rasio sukses dari counter kegagalan — bentuk nama metriknya mengikuti mode pengiriman.',
    'Jaga cardinalitas label tetap rendah: hanya nilai terbatas dan bermakna; identitas unik seperti ID pengguna jangan pernah menjadi label.',
    'Analisis yang utuh menyatukan metrik k6 dengan metrik server, disertai sinkronisasi waktu yang baik, annotation event, dan baseline pembanding dari run sebelumnya.'
  ]
});
