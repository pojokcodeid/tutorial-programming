/* ============================================================
   Pelajaran Grafana k6 — Bab 15: Docker, CI/CD & Otomasi Pengujian
   ============================================================ */
'use strict';

window.K6_LESSONS = window.K6_LESSONS || [];

window.K6_LESSONS.push({
  id: 'docker-ci-cd',
  title: 'Docker, CI/CD & Otomasi Pengujian',
  chapter: 'Otomasi & Analisis',
  duration: '12–14 menit',
  intro: [
    'Bayangkan sebuah alat ukur di laboratorium: hasilnya hanya bisa dipercaya bila kalibrasinya diketahui dan alat yang sama dipakai di semua tempat. k6 pun begitu — angka p95 sulit dibandingkan bila laptopmu memakai versi berbeda dari CI, apalagi sistem operasinya juga ikut berbeda. <b>Container</b> memastikan "alat ukurnya" selalu identik: k6 berjalan di lingkungan yang sama persis, baik di laptop, di server tim, maupun di dalam pipeline.',
    'Begitu k6 masuk ke pipeline, pengujian performa berhenti menunggu orang menjalankannya secara manual. Setiap <b>pull request</b> bisa diuji smoke test singkat, pengujian beban dijadwalkan mingguan ke staging, dan threshold berfungsi sebagai gerbang: tes gagal berarti pipeline merah, sementara hasilnya tetap tersimpan sebagai <b>artefak</b> untuk ditinjau.',
    'Bab ini menjalankan k6 lewat Docker, memasangnya di GitHub Actions, GitLab CI, dan Jenkins, lalu membahas threshold sebagai gate, jadwal pengujian beserta kunci antarjalur, serta cara menyimpan dan membandingkan hasil antar rilis.'
  ],
  objectives: [
    'Menjalankan skrip k6 lewat Docker: stdin, mount direktori, dan variabel lingkungan',
    'Menjelaskan pentingnya mengunci (pin) versi image k6 agar hasil konsisten antarlingkungan',
    'Memasang smoke test k6 ke GitHub Actions, GitLab CI, dan Jenkins beserta unggahan hasil',
    'Menerapkan threshold sebagai gate, jadwal pengujian, dan kunci antarjalur (concurrency)'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Mengapa k6 Dibungkus Container</h3><p>Alasan pertama adalah <b>konsistensi</b>. k6 berkembang cepat — antarversi ada nama metrik yang berubah dan perilaku executor yang disetel ulang. Bila laptopmu memakai k6 0.47 sementara CI memakai 0.50, angka p95 yang kamu bandingkan sebenarnya berasal dari dua alat yang sedikit berbeda. Dengan container kamu menentukan <b>image tag</b>, misalnya <code>grafana/k6:0.50.0</code>, sehingga semua orang memakai byte yang sama persis dan menghindari <code>latest</code> yang berubah diam-diam.</p><p>Alasan kedua: <b>tanpa pemasangan</b> — anggota tim baru cukup punya Docker, dan CI tidak perlu langkah instalasi tambahan. Alasan ketiga: <b>lingkungan benar-benar sama di mana-mana</b>, karena skrip, modul lokal, dan file data dibaca dari folder yang sama lewat <i>mount</i>. Image resmi juga berjalan sebagai <b>user non-root</b>, praktik keamanan yang baik; yang perlu diperhatikan hanya izin tulis ketika hasil tes ditulis kembali ke folder host.</p><ul><li><b>Dua cara memberi skrip</b> — lewat <i>stdin</i> dengan tanda <code>-</code>, atau lewat <i>bind mount</i> <code>-v</code>.</li><li><b>Variabel lingkungan</b> — diteruskan dengan <code>-e</code>, dengan nilai atau disalin dari host.</li><li><b>Kunci versi selalu</b> — wajib bila hasil pengujian dibandingkan antarwaktu.</li></ul>'
    },
    {
      type: 'example',
      title: 'Contoh: Menjalankan k6 di Docker',
      lang: 'bash',
      output: false,
      code: `# 1. Cara paling ringkas: skrip dikirim lewat stdin
docker run --rm -i grafana/k6:0.50.0 run - < scenarios/load.js

# 2. Cara harian: folder proyek dipetakan ke dalam container
docker run --rm -v "$PWD:/scripts" grafana/k6:0.50.0 run /scripts/scenarios/load.js

# 3. Teruskan env dari host (-e tanpa nilai = salin dari host)
docker run --rm -v "$PWD:/scripts" -e BASE_URL -e API_TOKEN \\
  grafana/k6:0.50.0 run /scripts/scenarios/smoke.js

# 4. Simpan hasil ke results/ di host
mkdir -p results
docker run --rm -v "$PWD:/scripts" -w /scripts \\
  grafana/k6:0.50.0 run --out json=results/smoke.json scenarios/smoke.js

# 5. Bila user bawaan image tidak boleh menulis, pakai user-mu
docker run --rm -u "$(id -u):$(id -g)" -v "$PWD:/scripts" -w /scripts \\
  grafana/k6:0.50.0 run --out json=results/smoke.json scenarios/smoke.js`,
      explain: [
        '<code>grafana/k6:0.50.0</code> adalah <b>image tag</b> yang dikunci; tanpa tag, versi bisa berubah diam-diam dan hasil pekan ini tidak lagi sebanding dengan pekan lalu.',
        '<code>-i</code> membuat stdin terbaca dan tanda <code>-</code> menandai skrip datang dari stdin — cara tercepat untuk tes singkat. <code>-v</code> plus <code>-w /scripts</code> membuat modul lokal seperti <code>lib/</code> tetap terbaca.',
        'Karena image berjalan sebagai user non-root, tulisan ke <code>results/</code> bisa ditolak; langkah 5 memakai <code>-u</code> dengan user host. Cek dokumentasi resmi untuk versi yang kamu pakai karena perilaku volume bisa berbeda antarlingkungan.'
      ]
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: '<p>Jaringan container <b>terpisah dari host</b>, sehingga <code>localhost</code> di dalam container menunjuk ke container itu sendiri — bukan aplikasimu.</p><ul><li>Target berjalan di host? Di macOS/Windows pakai <code>host.docker.internal</code>; di Linux bisa <code>--network host</code> atau IP jaringan bridge.</li><li>Buat folder <code>results/</code> lebih dahulu di host dan sesuaikan izinnya bila kamu memakai user bawaan image.</li><li>Jangan pernah menunjuk pipeline ke URL produksi — beban jatuh ke pengguna sungguhan.</li></ul>'
    },
    {
      type: 'example',
      title: 'Contoh: Workflow GitHub Actions',
      lang: 'yaml',
      output: false,
      code: `name: Performance Test (k6)

on:
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * 1'   # Senin 02:00 UTC: pengujian beban mingguan

env:
  BASE_URL: https://staging.example.com
  K6_CLOUD_TOKEN: \${{ secrets.K6_CLOUD_API_TOKEN }}

# Hanya satu pengujian beban per kelompok; sisanya menunggu
concurrency:
  group: perf-staging-\${{ github.ref }}
  cancel-in-progress: false

jobs:
  k6:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Pasang k6 dengan versi yang dikunci
        uses: grafana/setup-k6-action@v1
        with:
          k6-version: '0.50.0'

      - name: Jalankan tes sesuai kejadian
        run: |
          mkdir -p results
          if [ "\${{ github.event_name }}" = "schedule" ]; then
            k6 run --out json=results/load.json scenarios/load.js
          else
            k6 run --out json=results/smoke.json scenarios/smoke.js
          fi

      # Opsional, bila memakai Grafana Cloud k6 (secret harus terisi):
      # - if: env.K6_CLOUD_TOKEN != ''
      #   run: k6 cloud run --local-execution scenarios/smoke.js

      - name: Unggah hasil
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: k6-\${{ github.run_id }}
          path: results/
          retention-days: 30`,
      explain: [
        'Satu job melayani dua kejadian: <code>pull request</code> menjalankan smoke test singkat, <code>cron</code> menjalankan pengujian beban. Bila ingin terpisah, duplikasi job dengan <code>if</code> yang berbeda.',
        '<code>grafana/setup-k6-action@v1</code> memasang k6 sesuai <code>k6-version</code> — kuncilah angkanya. Nama action bisa berubah antarrilis, jadi cek dokumentasi resmi untuk versi yang kamu pakai.',
        '<code>if: always()</code> pada upload-artifact membuat hasil tetap tersimpan walaupun k6 keluar dengan kode gagal, dan <code>K6_CLOUD_API_TOKEN</code> dipetakan ke <code>K6_CLOUD_TOKEN</code>, variabel yang dibaca k6 untuk autentikasi cloud.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh: Job GitLab CI',
      lang: 'yaml',
      output: false,
      code: `stages:
  - test

performance-smoke:
  stage: test
  image:
    name: grafana/k6:0.50.0
    entrypoint: ['']
  variables:
    BASE_URL: "https://staging.example.com"
  resource_group: staging-perf
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
  script:
    - mkdir -p results
    - k6 run --out json=results/smoke.json scenarios/smoke.js
  artifacts:
    when: always
    paths:
      - results/
    expire_in: 30 days

# Load test dijalankan terpisah: pipeline terjadwal
# dengan skrip yang sama tetapi scenarios/load.js`,
      explain: [
        '<code>image: grafana/k6:0.50.0</code> membuat runner cukup menarik image, dan <code>entrypoint: [\'\']</code> mengosongkan entrypoint bawaan supaya GitLab tetap bisa menyiapkan shell sebelum <code>k6</code> berjalan.',
        '<code>artifacts: when: always</code> menyimpan hasil meski tes gagal, sementara <code>expire_in</code> menjadi kebijakan retensi otomatis milik GitLab.',
        '<code>resource_group: staging-perf</code> adalah kunci GitLab: dua pipeline saling menunggu alih-alih menabrakkan beban pada target yang sama.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh: Pipeline Jenkins (Groovy)',
      lang: 'javascript',
      output: false,
      code: `pipeline {
  agent any
  options {
    timestamps()
    timeout(time: 20, unit: 'MINUTES')
    lock(resource: 'staging-perf')   // butuh plugin Lockable Resources
  }
  environment {
    BASE_URL = 'https://staging.example.com'
  }
  stages {
    stage('Checkout') {
      steps { checkout scm }
    }
    stage('Performance Test') {
      steps {
        sh 'mkdir -p results'
        sh 'docker run --rm -u "$(id -u):$(id -g)" -e BASE_URL -v "$PWD:/scripts" -w /scripts grafana/k6:0.50.0 run --out json=results/smoke.json scenarios/smoke.js'
      }
      post {
        always { archiveArtifacts artifacts: 'results/**', allowEmptyArchive: true }
      }
    }
  }
  post {
    failure {
      emailext subject: 'Performance test GAGAL: \${env.JOB_NAME} #\${env.BUILD_NUMBER}',
               body: 'Periksa artefak hasil k6 pada build ini.',
               to: 'tim-perf@example.com'
    }
  }
}`,
      explain: [
        'Stage <b>Performance Test</b> menjalankan container k6 persis seperti di lokal. Perintah <code>sh</code> memakai kutip tunggal Groovy, sehingga <code>$PWD</code> dan <code>$(id -u)</code> diselesaikan oleh shell.',
        '<code>lock(resource: \'staging-perf\')</code> menahan job lain yang memakai resource yang sama — setara dengan blok <code>concurrency</code> di GitHub Actions.',
        'Kode keluar k6 bukan nol saat threshold gagal, sehingga stage merah, artefak tetap diarsipkan, dan email <code>failure</code> terkirim ke tim.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Threshold sebagai Gerbang Pipeline</h3><p>k6 keluar dengan kode status bukan nol ketika ada threshold yang gagal, sehingga CI otomatis tahu tes itu tidak lulus tanpa konfigurasi tambahan. Pada smoke test, pasang <b>abortOnFail</b> agar kegagalan tertangkap dini dan runner tidak membuang waktu: <code>thresholds: { http_req_failed: [{ threshold: \'rate&lt;0.01\', abortOnFail: true, delayAbortEval: \'5s\' }] }</code></p><table><thead><tr><th>Jenis tes</th><th>Kapan</th><th>Durasi</th><th>Ambang contoh</th></tr></thead><tbody><tr><td><b>Smoke test</b></td><td>Setiap pull request</td><td>30–60 detik</td><td><code>error&lt;1%</code>, <code>p95&lt;800ms</code> + <code>abortOnFail</code></td></tr><tr><td><b>Load test</b></td><td>Cron mingguan di staging</td><td>10–15 menit</td><td><code>p95&lt;500ms</code>, <code>error&lt;1%</code></td></tr><tr><td><b>Stress test</b></td><td>Menjelang rilis besar</td><td>20–30 menit</td><td><code>p95&lt;1500ms</code> (batas banting)</td></tr></tbody></table><h3>Kunci Antareksekusi</h3><p>Dua load test bersamaan pada target yang sama akan saling menyalahkan: VU dari tes kedua menambah beban pada tes pertama, sehingga angka keduanya tidak lagi mewakili skenario mana pun. Siapkan satu <b>concurrency guard</b> di tiap platform — <code>concurrency</code> dengan <code>cancel-in-progress: false</code> di GitHub Actions, <code>resource_group</code> di GitLab, <code>lock(resource: ...)</code> atau label environment khusus di Jenkins. Prinsipnya: smoke test boleh paralel di banyak tempat, pengujian beban hanya <b>satu per target</b>.</p><h3>Retensi Hasil dan Baseline</h3><p>Simpan ringkasan <code>results/*.json</code> sebagai artefak dengan retensi berbeda: 30 hari untuk PR, 90 hari untuk rilis, diberi nama seperti <code>baseline-v1.4.0.json</code>. Untuk membaca cepat persentilnya: <code>jq \'.metrics.http_req_duration.values["p(95)"]\' results/baseline-v1.4.0.json</code>. Bandingkan minimal <b>p95</b> dan <b>error rate</b> antar rilis dengan skenario yang sama; kenaikan p95 di atas 20% layak masuk tinjauan rilis.</p>'
    },
    {
      type: 'tip',
      title: 'Tips: Tulis Cara Mengulang Tesnya',
      text: 'Setiap kali menambah job pengujian, tulis juga perintah persis untuk menjalankannya ulang secara lokal di README tim — versi image, variabel, dan targetnya, contohnya: <code>docker run --rm -v "$PWD:/scripts" -e BASE_URL grafana/k6:0.50.0 run /scripts/scenarios/smoke.js</code>. Kalimat "jalankan seperti di CI" menyelamatkanmu ketika hasil pipeline tidak bisa direproduksi di laptop.'
    },
    {
      type: 'vocab',
      items: [
        ['Container', 'Kemasan aplikasi beserta dependensinya agar berjalan identik di laptop, CI, dan server.'],
        ['Image tag', 'Label versi image, misalnya grafana/k6:0.50.0; dikunci agar hasil pengujian konsisten.'],
        ['Pipeline', 'Rantai otomatis di sistem kontrol versi: checkout, jalankan tes, simpan hasil, putuskan lulus atau gagal.'],
        ['Artefak', 'Berkas hasil (JSON, log) yang disimpan CI setelah job selesai, termasuk saat job gagal.'],
        ['Smoke test di PR', 'Pengujian singkat puluhan detik pada setiap pull request untuk menangkap regresi lebih dulu.'],
        ['Scheduled test', 'Pengujian beban terjadwal, misal cron mingguan ke staging, bukan dijalankan tiap commit.'],
        ['Concurrency guard', 'Kunci yang menjamin hanya satu pengujian beban berjalan pada satu target pada satu waktu.']
      ]
    }
  ],
  recap: [
    'Docker membuat k6 berjalan dengan versi dan lingkungan identik; kunci selalu dengan image tag, jangan memakai latest.',
    'Skrip masuk lewat stdin atau mount, env lewat -e, hasil ditulis ke folder host — perhatikan izin user non-root dan host.docker.internal.',
    'GitHub Actions, GitLab CI, dan Jenkins memakai pola yang sama: pasang versi tetap, jalankan k6, unggah hasil dengan if: always().',
    'Threshold menjadi gerbang: smoke test singkat dengan abortOnFail di pull request, load dan stress test terjadwal mingguan ke staging.',
    'Concurrency guard mencegah dua pengujian berbenturan, dan artefak JSON per rilis menjadi baseline perbandingan p95 serta error rate.'
  ]
});
