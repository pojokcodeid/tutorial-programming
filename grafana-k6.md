# Roadmap Belajar Grafana k6: Dari Nol sampai Mahir

> **Tujuan:** mampu merancang, menjalankan, menganalisis, dan mengotomatisasi pengujian performa aplikasi menggunakan Grafana k6.
>
> **Target waktu:** 10–12 minggu dengan waktu belajar sekitar 5–7 jam per minggu. Sesuaikan tempo dengan pengalaman JavaScript, HTTP/API, dan Linux/terminal.
>
> **Catatan:** k6 adalah tool load/performance testing. Grafana adalah bagian dari ekosistem observability yang dapat digunakan untuk memvisualisasikan metrik hasil pengujian. Roadmap ini berfokus pada k6 open source terlebih dahulu, lalu integrasi Grafana dan layanan cloud bila diperlukan.

## Cara menggunakan roadmap

- [ ] Ikuti urutan modul; jangan langsung memulai dengan beban besar di production.
- [ ] Simpan script, konfigurasi, data uji, dan hasil eksperimen dalam repository Git.
- [ ] Untuk setiap topik, buat catatan: tujuan tes, asumsi, metrik, hasil, dan keputusan.
- [ ] Jalankan tes beban hanya pada sistem yang Anda miliki atau telah mendapat izin untuk mengujinya.
- [ ] Ulangi tes dengan baseline yang sama sebelum membandingkan perubahan.

## Ringkasan tahapan

| Tahap | Fokus | Estimasi |
|---|---|---:|
| 0 | Fondasi web, HTTP, dan performance testing | 3–5 hari |
| 1 | Instalasi dan penggunaan dasar k6 | 1 minggu |
| 2 | JavaScript dan struktur script | 1 minggu |
| 3 | Checks, thresholds, dan metrik | 1 minggu |
| 4 | Skenario beban dan model traffic | 1 minggu |
| 5 | API testing tingkat lanjut | 1 minggu |
| 6 | Data, setup/teardown, dan organisasi test | 1 minggu |
| 7 | Hasil, Grafana, dan observability | 1 minggu |
| 8 | CI/CD, container, dan otomasi | 1 minggu |
| 9 | Analisis performa dan optimasi | 1–2 minggu |
| 10 | Proyek akhir dan kesiapan mahir | 1 minggu |

---

## Tahap 0 — Fondasi sebelum k6

**Target:** memahami apa yang diuji dan cara menilai hasilnya.

### Materi

- [ ] Dasar client-server dan alur request/response.
- [ ] HTTP method: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.
- [ ] Status code, header, cookies, query parameters, dan request body.
- [ ] JSON dan autentikasi API: API key, bearer token, session cookie.
- [ ] Dasar REST API dan cara membaca dokumentasi API.
- [ ] Dasar terminal: menjalankan perintah, environment variable, dan membaca file.
- [ ] Dasar JavaScript: variabel, fungsi, array, object, import/export, dan JSON.
- [ ] Konsep performance testing: load, stress, spike, soak, dan smoke test.
- [ ] Metrik: latency, throughput, request rate, error rate, dan percentile (p90/p95/p99).
- [ ] Perbedaan virtual users (VUs), iterations, dan requests.

### Latihan

- [ ] Gunakan `curl` atau Postman untuk memanggil endpoint API.
- [ ] Catat waktu respons dan status code untuk beberapa request.
- [ ] Tentukan contoh SLO, misalnya p95 di bawah 500 ms dan error rate di bawah 1% (sesuaikan kebutuhan sistem).

**Lulus tahap jika:** Anda bisa menjelaskan endpoint yang diuji, skenario pengguna, metrik keberhasilan, dan risiko pengujian.

## Tahap 1 — Instalasi dan penggunaan dasar k6

**Target:** dapat menjalankan tes pertama dan membaca ringkasan hasil.

### Materi

- [ ] Pahami perbedaan k6 open source, Grafana Cloud k6, dan integrasi Grafana.
- [ ] Instal k6 sesuai OS menggunakan petunjuk resmi.
- [ ] Verifikasi instalasi dengan `k6 version`.
- [ ] Buat file `smoke.js`.
- [ ] Jalankan tes dengan `k6 run smoke.js`.
- [ ] Pahami ringkasan metrik standar.
- [ ] Pelajari opsi CLI dasar, misalnya `--vus` dan `--duration`.
- [ ] Pahami bahwa satu VU menjalankan iterasi script secara berulang selama tes.

### Contoh pertama

Simpan sebagai `smoke.js`:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  duration: '10s',
};

export default function () {
  const res = http.get('https://test.k6.io');

  check(res, {
    'status adalah 200': (r) => r.status === 200,
    'response memiliki body': (r) => r.body && r.body.length > 0,
  });

  sleep(1);
}
```

Jalankan:

```bash
k6 run smoke.js
```

### Latihan

- [ ] Ubah durasi menjadi 30 detik.
- [ ] Tambahkan check untuk content type.
- [ ] Bandingkan hasil ketika `sleep(1)` dihapus.
- [ ] Catat metrik `http_req_duration`, `http_req_failed`, dan `iterations`.

**Lulus tahap jika:** Anda bisa menulis, menjalankan, dan menjelaskan hasil smoke test.

## Tahap 2 — JavaScript dan struktur script k6

**Target:** membuat script yang mudah dibaca dan digunakan ulang.

### Materi

- [ ] `import` modul k6.
- [ ] `options` dan `export default function`.
- [ ] Lifecycle: init, `setup()`, VU/default function, dan `teardown()`.
- [ ] Scope variabel dan fungsi helper.
- [ ] Membaca environment variable dengan `__ENV`.
- [ ] Menjalankan script dengan parameter `-e`.
- [ ] Menggunakan modul lokal dan memecah script ke beberapa file.
- [ ] Membuat fungsi helper untuk request, header, dan validasi.
- [ ] Memahami keterbatasan runtime JavaScript k6 dibanding Node.js/browser.

### Latihan

- [ ] Pindahkan base URL ke `__ENV.BASE_URL`.
- [ ] Buat helper `getHeaders()` dan `assertStatus()`.
- [ ] Pisahkan konfigurasi, helper HTTP, dan skenario ke file berbeda.
- [ ] Pastikan secret tidak ditulis langsung ke source code atau commit Git.

Contoh:

```javascript
import http from 'k6/http';

const BASE_URL = __ENV.BASE_URL || 'https://test.k6.io';

export default function () {
  http.get(`${BASE_URL}/`);
}
```

Jalankan:

```bash
k6 run -e BASE_URL=https://test.k6.io smoke.js
```

## Tahap 3 — Checks, thresholds, dan metrik

**Target:** tes memiliki kriteria lulus/gagal yang dapat diukur.

### Materi

- [ ] Bedakan `check()` dengan `thresholds`.
- [ ] Gunakan `http_req_duration`, `http_req_failed`, dan `checks`.
- [ ] Pahami average vs median vs percentile.
- [ ] Pelajari p90, p95, dan p99 serta dampak outlier.
- [ ] Tetapkan threshold sesuai SLO atau kebutuhan bisnis.
- [ ] Pahami exit code ketika threshold gagal.
- [ ] Gunakan custom metrics: `Counter`, `Gauge`, `Rate`, dan `Trend`.
- [ ] Bedakan metrik per request dan metrik bisnis buatan sendiri.

Contoh:

```javascript
import http from 'k6/http';
import { check } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const businessErrors = new Rate('business_errors');
const apiDuration = new Trend('api_duration');

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
    checks: ['rate>0.99'],
    api_duration: ['p(95)<500'],
    business_errors: ['rate<0.01'],
  },
};

export default function () {
  const res = http.get('https://test.k6.io');

  check(res, {
    'status 200': (r) => r.status === 200,
  });

  businessErrors.add(res.status !== 200);
  apiDuration.add(res.timings.duration);
}
```

> Angka threshold di atas hanya contoh. Sesuaikan dengan baseline, SLO, endpoint, dan lingkungan yang diuji.

### Latihan

- [ ] Buat satu threshold yang sengaja gagal lalu amati exit code.
- [ ] Bandingkan p95 dan average pada beberapa kali eksekusi.
- [ ] Tambahkan metrik untuk error bisnis, bukan hanya error HTTP.

## Tahap 4 — Skenario beban dan model traffic

**Target:** meniru pola pengguna yang realistis, bukan hanya mengirim request sebanyak-banyaknya.

### Materi

- [ ] Konfigurasi sederhana dengan `vus` dan `duration`.
- [ ] `stages` untuk ramp-up, steady state, dan ramp-down.
- [ ] Executors: `constant-vus`, `ramping-vus`, `constant-arrival-rate`, `ramping-arrival-rate`, dan `shared-iterations`.
- [ ] Perbedaan model berbasis VU dan model berbasis arrival rate.
- [ ] Konsep iteration duration dan kebutuhan VU pada arrival-rate executor.
- [ ] `gracefulRampDown`, `gracefulStop`, dan `maxDuration`.
- [ ] Menghindari generator beban menjadi bottleneck.
- [ ] Memilih beban berdasarkan pola traffic dan pertanyaan yang ingin dijawab.

Contoh ramping VUs:

```javascript
export const options = {
  stages: [
    { duration: '1m', target: 5 },
    { duration: '3m', target: 20 },
    { duration: '1m', target: 0 },
  ],
};
```

### Latihan

- [ ] Jalankan smoke test, load test, stress test, spike test, dan soak test pada lingkungan yang diizinkan.
- [ ] Buat grafik beban dan tandai kapan error atau latency mulai meningkat.
- [ ] Bandingkan skenario VU konstan dengan arrival rate yang konstan.

**Lulus tahap jika:** Anda bisa memilih executor dan menjelaskan mengapa model tersebut cocok untuk tujuan tes.

## Tahap 5 — API testing tingkat lanjut

**Target:** menguji alur API yang menyerupai aktivitas nyata pengguna.

### Materi

- [ ] `http.get`, `http.post`, `http.put`, dan `http.del`.
- [ ] Header, query parameters, cookies, form data, dan JSON body.
- [ ] Validasi status, response body, dan header.
- [ ] Grup request menggunakan `group()`.
- [ ] Menggunakan `http.batch()` secara tepat.
- [ ] Timeout dan penanganan respons yang gagal.
- [ ] Autentikasi bearer token dan session cookie.
- [ ] Alur login → ambil data → ubah data → logout.
- [ ] Correlation: mengambil ID/token dari response sebelumnya.
- [ ] Menghindari ketergantungan antar-VU dan konflik data uji.
- [ ] Memahami redirect, TLS, dan konfigurasi koneksi jika relevan.

### Latihan

- [ ] Buat skenario CRUD pada API pengujian milik sendiri.
- [ ] Ambil ID dari response `POST` lalu gunakan untuk request berikutnya.
- [ ] Validasi hasil bisnis, bukan hanya status `200`.
- [ ] Tambahkan pemeriksaan untuk respons tidak valid dan timeout.
- [ ] Pisahkan tes autentikasi dari tes endpoint jika tujuan pengukurannya berbeda.

## Tahap 6 — Data, lifecycle, dan organisasi test suite

**Target:** membuat test suite yang dapat dipelihara dan menghasilkan data uji yang aman.

### Materi

- [ ] Lifecycle `setup()` dan `teardown()`.
- [ ] Membaca file data menggunakan `SharedArray` bila sesuai.
- [ ] Mengelola fixture JSON/CSV.
- [ ] Memahami bahwa data `setup()` dibagikan sebagai data hasil serialisasi, bukan shared mutable state.
- [ ] Data unik per VU/iterasi dan strategi pencegahan tabrakan.
- [ ] Menyiapkan serta membersihkan data uji dengan aman.
- [ ] Memisahkan smoke, load, stress, spike, dan soak test.
- [ ] Membuat konfigurasi per lingkungan.
- [ ] Mengelola secret melalui environment/secret manager.
- [ ] Menetapkan aturan penamaan script, metrics, dan skenario.

### Struktur repository yang disarankan

```text
k6-performance-tests/
├── README.md
├── config/
│   ├── dev.json
│   └── staging.json
├── data/
│   └── users.json
├── lib/
│   ├── auth.js
│   └── helpers.js
├── scenarios/
│   ├── smoke.js
│   ├── load.js
│   ├── stress.js
│   └── soak.js
└── results/
```

> Jangan commit token, password, data pribadi, atau hasil tes yang mengandung informasi sensitif. Pertimbangkan apakah folder `results/` perlu diabaikan oleh Git.

## Tahap 7 — Hasil pengujian, Grafana, dan observability

**Target:** menghubungkan hasil tes dengan metrik yang membantu menemukan bottleneck.

### Materi

- [ ] Pahami output terminal k6 dan cara menyimpan ringkasan hasil.
- [ ] Pelajari output JSON dan opsi output yang tersedia pada versi k6 yang digunakan.
- [ ] Pahami perbedaan metrik dari load generator dan metrik internal aplikasi.
- [ ] Dasar Grafana: data source, dashboard, panel, variable, dan alert.
- [ ] Pahami time series, label, aggregation, dan rentang waktu.
- [ ] Pilih output k6 ke backend yang sesuai dengan kebutuhan dan versi yang digunakan.
- [ ] Pelajari integrasi k6 dengan Prometheus/remote write atau Grafana Cloud k6 berdasarkan dokumentasi resmi.
- [ ] Hubungkan metrik beban dengan metrik aplikasi/infrastruktur: CPU, memori, database, queue, dan error log.
- [ ] Bangun dashboard yang menunjukkan request rate, latency p95/p99, error rate, VUs, dan resource utilization.
- [ ] Samakan timestamp dan rentang waktu antara tes dan dashboard.
- [ ] Pelajari batasan cardinality agar label tidak menghasilkan terlalu banyak time series.

### Latihan

- [ ] Jalankan tes singkat dan simpan hasilnya.
- [ ] Buat dashboard dengan panel request rate, latency, dan error rate.
- [ ] Bandingkan waktu ketika latency naik dengan CPU, database connection pool, atau log error.
- [ ] Tulis kesimpulan berbasis bukti, bukan hanya berdasarkan satu angka.

**Catatan:** detail setup output dan integrasi berubah antarversi. Ikuti dokumentasi resmi untuk versi k6, Grafana, dan backend metrik yang dipakai.

## Tahap 8 — Otomasi, Docker, dan CI/CD

**Target:** menjalankan tes secara konsisten dalam pipeline.

### Materi

- [ ] Jalankan k6 di Docker atau container yang sesuai.
- [ ] Pin versi image/tool agar hasil lebih konsisten.
- [ ] Simpan konfigurasi dan script dalam Git.
- [ ] Jalankan smoke test pada pull request atau pipeline.
- [ ] Jalankan load test terjadwal pada lingkungan khusus.
- [ ] Simpan output dan artefak hasil sebagai pipeline artifacts.
- [ ] Atur secret dan variabel environment di CI/CD.
- [ ] Terapkan threshold sebagai gate pipeline secara hati-hati.
- [ ] Bedakan tes cepat untuk feedback developer dan tes berat untuk lingkungan terkontrol.
- [ ] Kelola concurrency agar beberapa pipeline tidak membebani target secara bersamaan.
- [ ] Tetapkan retensi hasil dan proses membandingkan baseline.

### Latihan

- [ ] Buat pipeline yang menjalankan smoke test.
- [ ] Buat pipeline manual untuk load test di staging.
- [ ] Buat pipeline gagal bila threshold utama tidak tercapai.
- [ ] Pastikan laporan tetap tersedia ketika tes gagal.
- [ ] Dokumentasikan cara menjalankan ulang tes secara lokal.

## Tahap 9 — Analisis performa dan optimasi

**Target:** mendiagnosis penyebab penurunan performa secara sistematis.

### Materi

- [ ] Tetapkan baseline yang dapat diulang.
- [ ] Pisahkan latency client, network, server, dan dependency jika datanya tersedia.
- [ ] Analisis p50/p90/p95/p99, throughput, dan error rate bersama-sama.
- [ ] Kenali gejala bottleneck CPU, memori, database, lock, pool koneksi, cache, dan downstream service.
- [ ] Perhatikan saturation dan antrean saat traffic meningkat.
- [ ] Bedakan limit aplikasi dengan limit load generator.
- [ ] Pahami dampak TLS, DNS, connection reuse, payload size, dan think time.
- [ ] Bandingkan satu perubahan pada satu waktu.
- [ ] Ulangi pengujian setelah optimasi dengan beban dan kondisi yang setara.
- [ ] Dokumentasikan ketidakpastian, variasi, dan keterbatasan hasil.

### Latihan

- [ ] Buat baseline sebelum perubahan.
- [ ] Naikkan beban bertahap sampai titik ketika latency/error meningkat tajam.
- [ ] Gunakan dashboard, log, dan metrik sistem untuk mengajukan hipotesis bottleneck.
- [ ] Ubah satu hal, lalu jalankan tes ulang.
- [ ] Tulis rekomendasi berdasarkan data.

## Tahap 10 — Proyek akhir: performance test API end-to-end

**Target:** menyatukan seluruh keterampilan dalam deliverable yang bisa ditinjau tim.

Pilih API milik sendiri atau staging yang sudah mendapat izin.

### Persyaratan proyek

- [ ] README yang menjelaskan tujuan, ruang lingkup, prasyarat, dan cara menjalankan.
- [ ] Konfigurasi base URL dan secret dari environment.
- [ ] Smoke test untuk validasi cepat.
- [ ] Skenario alur pengguna yang realistis.
- [ ] Checks untuk respons dan aturan bisnis.
- [ ] Threshold yang diturunkan dari SLO atau baseline yang disepakati.
- [ ] Minimal satu skenario ramping VUs dan satu arrival-rate (bila sesuai).
- [ ] Data uji yang tidak saling bertabrakan.
- [ ] Dashboard atau laporan yang relevan.
- [ ] Integrasi CI/CD untuk smoke test.
- [ ] Hasil baseline dan hasil setelah satu optimasi.
- [ ] Laporan akhir dengan grafik/tabel, temuan, batasan, dan rekomendasi.

### Template laporan hasil

```text
# Laporan Performance Test

## Ringkasan
- Tanggal:
- Environment:
- Versi aplikasi:
- Versi k6:
- Tujuan:

## Skenario
- Pola traffic:
- Durasi:
- Target VU atau arrival rate:
- Endpoint/alur:
- Data uji:

## Kriteria keberhasilan
- p95:
- Error rate:
- Throughput:
- Kriteria bisnis:

## Hasil
- Request rate:
- p50 / p95 / p99:
- Error rate:
- Threshold yang gagal:
- Metrik server/database:

## Analisis
- Kapan performa mulai turun:
- Bukti yang mendukung:
- Dugaan bottleneck:
- Batasan tes:

## Rekomendasi dan tindak lanjut
- Perubahan yang disarankan:
- Pemilik tindak lanjut:
- Rencana pengujian ulang:
```

## Checklist kemampuan mahir

Anda siap dianggap mahir secara praktis ketika dapat:

- [ ] Memilih model beban yang sesuai dengan pertanyaan bisnis.
- [ ] Menulis script modular untuk alur API multi-langkah.
- [ ] Membuat checks, custom metrics, dan thresholds yang bermakna.
- [ ] Menggunakan data uji dan autentikasi dengan aman.
- [ ] Menghindari hasil menyesatkan akibat load generator atau desain skenario.
- [ ] Mengintegrasikan tes dengan pipeline dan menyimpan artefak.
- [ ] Membaca dashboard Grafana bersama log dan metrik aplikasi.
- [ ] Menjelaskan perbedaan latency, throughput, error rate, dan saturation.
- [ ] Mengidentifikasi titik degradasi dan menyusun hipotesis bottleneck berbasis bukti.
- [ ] Membandingkan hasil secara adil dan menulis laporan yang dapat ditindaklanjuti.
- [ ] Menjalankan tes dengan izin, batas beban, dan rencana penghentian yang jelas.

## Referensi resmi

Mulailah dari dokumentasi resmi, lalu praktikkan tiap topik pada project latihan:

- [Grafana k6 documentation](https://grafana.com/docs/k6/latest/)
- [Get started with k6](https://grafana.com/docs/k6/latest/get-started/)
- [k6 JavaScript API](https://grafana.com/docs/k6/latest/javascript-api/)
- [k6 test types](https://grafana.com/docs/k6/latest/testing-guides/test-types/)
- [k6 scenarios and executors](https://grafana.com/docs/k6/latest/using-k6/scenarios/)
- [k6 metrics](https://grafana.com/docs/k6/latest/using-k6/metrics/)
- [k6 thresholds](https://grafana.com/docs/k6/latest/using-k6/thresholds/)
- [Grafana documentation](https://grafana.com/docs/grafana/latest/)
- [Grafana Cloud k6](https://grafana.com/docs/grafana-cloud/testing/k6/)

> **Saran urutan praktik:** mulai dari API lokal/staging, buat smoke test, tambahkan thresholds, bangun skenario traffic, integrasikan metrik, lalu otomatisasi. Jangan mengirim stress/spike test ke sistem publik atau production tanpa persetujuan dan rencana mitigasi.
