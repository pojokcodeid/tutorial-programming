/* ============================================================
   Pelajaran Grafana k6 — Bab 16: Analisis Bottleneck & Optimasi
   ============================================================ */
'use strict';

window.K6_LESSONS = window.K6_LESSONS || [];

window.K6_LESSONS.push({
  id: 'analisis-bottleneck',
  title: 'Analisis Bottleneck & Optimasi',
  chapter: 'Otomasi & Analisis',
  duration: '14–16 menit',
  intro: [
    'Pernahkah kamu mempercepat mobil yang ternyata sedang menyeret rem tangan? Hasilnya percuma — yang harus dicari dulu adalah bagian yang menahan laju. Begitu pula sistem: satu komponen yang kehabisan kapasitas akan menahan seluruh alur, dan itulah <b>bottleneck</b>. Tugas kita bukan menebak-nebak, melainkan membaca bukti yang ditinggalkan bottleneck itu.',
    'k6 memberi angka — latency, throughput, error — tetapi angka tidak menjelaskan sendiri penyebabnya. Angka baru berguna ketika dibaca bersama dashboard resource, log aplikasi, dan perilaku kurva selama beban berjalan. Di sinilah banyak tim tersesat: langsung mengubah sesuatu, lalu bingung ketika hasilnya tidak membaik atau justru memburuk.',
    'Bab ini membekalimu metode kerja yang bisa diulang, cara membaca pola kurva dan error, tabel gejala bottleneck yang umum, metode <b>USE</b> untuk membaca resource, pertimbangan agar load generator sendiri tidak ikut menjadi bottleneck, serta cara menulis rekomendasi berbasis bukti yang bisa ditindaklanjuti tim.'
  ],
  objectives: [
    'Menjalankan siklus kerja: baseline, observasi, hipotesis, satu perubahan, ulangi, dokumentasikan',
    'Membaca pola kurva latency dan jenis error untuk mempersempit dugaan bottleneck',
    'Menerapkan metode USE serta memeriksa resource server, database, dan load generator',
    'Menyusun rekomendasi optimasi berbasis angka beserta ketidakpastiannya'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Siklus Kerja yang Bisa Diulang</h3><p>Mengoptimasi tanpa metode ibarat mengutak-atik rem mobil sambil berjalan: kamu tidak akan pernah tahu perubahan mana yang benar-benar menolong. Pakailah siklus enam langkah ini, satu putaran penuh untuk satu dugaan:</p><ol><li><b>Baseline yang bisa diulang</b> — jalankan skenario yang sama minimal sekali lagi; bila selisih angkanya besar (misal lebih dari 10%), perbaiki dulu stabilitasnya. Tanpa baseline yang masuk akal, semua perbandingan sesudahnya meragukan.</li><li><b>Observasi</b> — pantau dashboard resource, log aplikasi, dan metrik k6 selama tes berjalan, bukan hanya setelah selesai.</li><li><b>Hipotesis</b> — ubah kecurigaan menjadi kalimat spesifik: "p95 melonjak setelah 40 detik karena koneksi database habis".</li><li><b>Ubah satu hal saja</b> — tambah index, naikkan connection pool, atau kecilkan payload. Satu perubahan per putaran.</li><li><b>Ulangi dengan kondisi setara</b> — skenario, data, jam, dan target sama; hanya variabel percobaan yang berubah.</li><li><b>Dokumentasikan ketidakpastian</b> — catat apa yang belum terukur: cache masih hangat, data uji sedikit, atau tes baru dijalankan sekali.</li></ol><p>Satu putaran sering belum cukup. Ulangi sampai hipotesismu terbukti atau terbantah, dan berhentilah ketika angka tidak lagi membaik — di situlah kamu sampai di batas arsitektur, bukan di batas keberuntungan.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Membaca Pola dari Kurva',
      lang: 'text',
      output: false,
      code: `SEHAT                        MENDEKATI SATURASI
latency                      latency
 |    ___________            |                    ____
 |___/                       |               ____/
 |___                        |______________/
 +-------------> waktu        +-------------> waktu
 throughput naik lalu datar   throughput jalan duluan,
                              latency melonjak di akhir

MELONJAK PADA TITIK TERTENTU        GAGAL SEJAK AWAL
latency                             seluruh request error
 |                      ____        | xxx connection refused
 |                 ____/            | xxx timeout
 |_______________/                  +-------------> waktu
 +-------------> waktu              layanan tidak pernah
 menanjak tajam setelah VU tertentu  merespons sama sekali`,
      explain: [
        'Pola sehat: latency datar sementara throughput masih naik — kapasitas tersisa. Pola melonjak di akhir adalah tanda klasik <b>saturation</b>: resource sudah bekerja penuh sejak awal dan antrean mulai menumpuk.',
        'Ketika muncul pesan <b>Insufficient VUs</b> pada executor <code>arrival-rate</code>, yang kehabisan VU adalah generator-mu untuk mempertahankan laju yang diminta — bukan server yang lambat. Naikkan <code>preallocatedVUs</code> atau turunkan <code>targetRPS</code>.',
        'Gagal sejak awal dengan koneksi menolak hampir selalu berarti layanan mati atau port tertutup, bukan beban berlebih — periksa kesehatan pod dulu sebelum mengutak-atik kode.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Menerjemahkan Error menjadi Dugaan</h3><table><thead><tr><th>Gejala</th><th>Penyebab umum</th><th>Cara cepat memastikan</th></tr></thead><tbody><tr><td><code>http_req_timeout</code></td><td>Layanan hidup tetapi lambat; menunggu giliran</td><td>Lihat p95 per endpoint dari log/tag, cocokkan dengan log aplikasi</td></tr><tr><td>Status <code>5xx</code></td><td>Kesalahan kode atau database di sisi server</td><td>Tab Log pada k6, filter status; buka stack trace di log server</td></tr><tr><td><code>connection refused</code></td><td>Layanan mati, port tertutup, atau autoscale ke nol</td><td>Cek kesehatan pod dan readiness probe</td></tr><tr><td><b>Insufficient VUs</b></td><td>Executor <code>arrival-rate</code> kehabisan VU</td><td>Naikkan <code>preallocatedVUs</code>, kurangi target RPS</td></tr></tbody></table><h3>Bottleneck Umum dan Gejalanya</h3><table><thead><tr><th>Bottleneck</th><th>Gejala khas</th></tr></thead><tbody><tr><td>CPU server penuh</td><td>Latency naik merata di hampir semua endpoint, error sedikit</td></tr><tr><td>Memori / GC</td><td>Latensi melonjak periodik (gigi gergaji), throughput turun saat GC pause</td></tr><tr><td>Database</td><td>Hanya endpoint baca/tulis yang melonjak; dugaan: query N+1, lock, koneksi pool habis, index kurang</td></tr><tr><td>Cache miss</td><td>Awal tes lambat lalu membaik; buruk saat cache di-reset</td></tr><tr><td>Layanan downstream</td><td>Hanya satu alur (misal pembayaran) yang lambat; error 502/timeout terbatas di sana</td></tr><tr><td>Antrean menumpuk</td><td>Kedalaman antrean naik; latency penuh waktu menunggu, bukan waktu proses</td></tr></tbody></table><h3>USE Method secara Singkat</h3><p>Untuk tiap resource tanyakan tiga hal: <b>Utilization</b> (seberapa penuh dipakai), <b>Saturation</b> (apakah pekerjaan menumpuk), dan <b>Errors</b> (apakah ada galat nyata). Metrik yang wajib terlihat di dasbormu: CPU %, pemakaian memori dan lama GC, disk I/O, penggunaan jaringan, koneksi database dibanding limit-nya, jumlah thread pool yang aktif, serta kedalaman antrean.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Dampak Jaringan pada Angka Latency',
      lang: 'text',
      output: false,
      code: `SUMBER                      DAMPAK PADA ANGKA           YANG BISA DILAKUKAN
--------------------------  --------------------------  ---------------------------
TLS handshake baru          +50..300 ms per koneksi     biarkan k6 memakai keep-alive
Resolusi DNS ulang          +5..100 ms tiap request     pakai hostname yang stabil
Ukuran payload besar        +waktu transfer (bandwidth) kompres, kurangi field
Koneksi diputus tiap req    handshake berulang          jangan menutup koneksi cepat
Think time (sleep)          TIDAK masuk http_req_duration  sleep hanya memperlambat
                            -> jangan mengklaim latensi turun gara-gara sleep         laju, bukan server`,
      explain: [
        'k6 memakai <b>keep-alive bawaan</b>: koneksi dipakai ulang antar iterasi, jadi TLS handshake cukup sekali per koneksi. Bila angkanya melonjak padahal server terasa sehat, periksa apakah ada proks yang memutus koneksi terlalu sering.',
        'Latency adalah gabungan server dan jaringan. Tes dari luar jaringan kantor atau lintas benua akan memberi angka berbeda — sebutkan lokasi generator di laporanmu.',
        '<code>sleep()</code> tidak ikut dihitung <code>http_req_duration</code>; ia hanya menurunkan laju permintaan. Jangan pernah menyimpulkan "server lebih cepat" dari jeda yang kamu sendiri yang tambahkan.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh: Skrip Ramah bagi Load Generator',
      lang: 'javascript',
      output: false,
      code: `import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  discardResponseBodies: true,
  vus: 300,
  duration: '5m',
  tags: { run_id: __ENV.RUN_ID || 'lokal' },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

export default function () {
  const res = http.get(BASE_URL + '/api/orders', { tags: { endpoint: 'orders' } });
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(1);
}`,
      explain: [
        'Generator juga bisa jadi bottleneck. Sebelum percaya hasilnya, cek CPU dan RAM mesin k6 (misal <code>htop</code> atau <code>docker stats</code>); bila CPU menetap di atas sekitar 75%, pindahkan ke mesin yang lebih kuat atau pecah beban.',
        '<code>discardResponseBodies: true</code> membuat k6 tidak menyimpan isi respons di memori — penghematan besar bila responya ratusan kilobyte dan kamu tidak memakainya.',
        'Kurangi log dan check yang berlebihan: satu <code>check</code> per langkah bisnis sudah cukup. Bila perlu beberapa generator, jalankan agar metrik tetap terbaca — misal mengarahkan semua ke satu dasbor, atau menjalankannya bergantian agar angkanya mudah ditafsirkan.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh: Dari Baseline ke Rekomendasi',
      lang: 'text',
      output: false,
      code: `SIKLUS
1 baseline (3x, selisih < 10%)   p95 820 ms   error 1,4 %
2 observasi dashboard + log      query /orders lambat, CPU DB 95 %
3 hipotesis                      tanpa index -> sequential scan
4 ubah SATU hal                  CREATE INDEX idx_orders_created
5 ulangi kondisi setara          p95 310 ms   error 0,4 %

PERBANDINGAN
metrik            sebelum    sesudah    selisih
p95 latency       820 ms     310 ms     -62 %
p99 latency       1,9 s      480 ms     -75 %
error rate        1,4 %      0,4 %      -1,0 poin
throughput        210 req/s  460 req/s  +119 %

REKOMENDASI
temuan        : GET /orders melakukan sequential scan pada 30 baris data
bukti         : p95 820 -> 310 ms setelah index; CPU DB 95% -> 61 %
rekomendasi   : terapkan index idx_orders_created di seluruh lingkungan
pemilik       : tim data (pull request terpisah)
rencana ulang : jalankan load test mingguan skenario yang sama setelah deploy
ketidakpastian: data uji 30 hari, cache hangat, satu kali jalan per kondisi`,
      explain: [
        'Angka 820 ms menjadi 310 ms bukan sekadar cerita sukses — ia disertai bukti kedua (CPU database turun) dan satu perubahan yang jelas, sehingga kausalitasnya masuk akal.',
        'Bagian <b>ketidakpastian</b> justru membuat laporan dipercaya: sebutkan apa yang belum teruji, misal data terlalu sedikit, tes baru sekali, atau kondisi cache yang belum dingin.',
        'Selalu sertakan pemilik tindakan dan rencana pengujian ulang; tanpa keduanya, temuan performa berhenti di dokumen dan tidak pernah diperbaiki.'
      ]
    },
    {
      type: 'tip',
      title: 'Tips: Menjaga Perbandingan Tetap Adil',
      text: 'Bandingkan hanya tes yang kondisinya setara: skenario dan data sama, jam kerja yang sama bila ada efek cron, cache dalam kondisi serupa, dan target yang sama. Jalankan baseline minimal dua sampai tiga kali lalu ambil angka khasnya, beri tag <code>run_id</code> pada tiap percobaan supaya hasil di dasbor mudah dibedakan, dan simpan ringkasannya sebagai acuan rilis.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: '<p>Satu kali jalan <b>bukan kebenaran</b>. Optimasi harus diverifikasi ulang dengan beban yang setara: jalankan kembali skenario yang sama sebelum dan sesudah perubahan, idealnya lebih dari sekali. Angka p95 yang membaik sekali bisa jadi kebetulan — cache sedang hangat, data uji sedikit, atau target lain sedang lengang. Sebutkan selalu berapa kali tes dijalankan dan dalam kondisi apa dalam laporanmu.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Bottleneck', 'Komponen yang membatasi laju keseluruhan sistem; memperbaikinya = memperbaiki semua alur.'],
        ['Baseline', 'Hasil pengujian acuan yang bisa diulang dan dipakai sebagai pembanding sebelum sesudah perubahan.'],
        ['Saturation', 'Kondisi resource sudah penuh sehingga pekerjaan menumpuk dalam antrean.'],
        ['USE method', 'Cara membaca tiap resource: Utilization, Saturation, lalu Errors.'],
        ['Load generator', 'Mesin yang menjalankan k6; bisa sendiri menjadi bottleneck bila CPU/RAM-nya habis.'],
        ['Think time', 'Jeda yang disimulasikan antar permintaan; memperlambat laju, bukan mempercepat server.'],
        ['discardResponseBodies', 'Opsi k6 agar isi respons tidak disimpan di memori generator.'],
        ['Regresi performa', 'Angka performa yang memburuk setelah sebuah perubahan atau rilis masuk.']
      ]
    }
  ],
  recap: [
    'Bekerjalah dalam siklus: baseline yang bisa diulang, observasi, hipotesis spesifik, satu perubahan, ulangi dengan kondisi setara, lalu dokumentasikan ketidakpastiannya.',
    'Pola kurva memberi petunjuk: latency datar dengan throughput naik berarti sehat; melonjak di akhir berarti mendekati saturation.',
    'Tiap jenis error menunjuk penyebab berbeda — timeout, 5xx, connection refused, dan Insufficient VUs — sehingga perbaikannya pun berbeda.',
    'Metode USE membantu membaca resource, dan load generator sendiri wajib diperiksa agar bukan dialah yang membatasi hasil.',
    'Rekomendasi yang baik menyebut temuan, bukti angka, tindakan, pemilik, rencana pengujian ulang, beserta ketidakpastian tes.'
  ]
});
