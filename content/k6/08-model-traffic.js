/* ============================================================
   Pelajaran Grafana k6 — Bab 8: Merancang Model Traffic yang Realistis
   ============================================================ */
'use strict';

window.K6_LESSONS = window.K6_LESSONS || [];

window.K6_LESSONS.push({
  id: 'model-traffic',
  title: 'Merancang Model Traffic yang Realistis',
  chapter: 'Skenario Beban',
  duration: '8–10 menit',
  intro: [
    'Bayangkan kamu merancang uji jembatan. Kalau kamu menaruh truk di tengah jembatan dengan cara yang tidak pernah terjadi di dunia nyata — semua truk datang di detik yang sama, lalu hilang serentak — hasil ujimu tidak akan menceritakan kebenaran apa pun. Begitu pula dengan tes beban: yang menentukan kegunaan hasilnya bukan berapa besar angkanya, melainkan <b>seberapa mirip bentuk bebannya dengan trafik sungguhan</b>.',
    'Di sinilah dua model klasik muncul. <b>Model tertutup (closed/VU-based)</b> menganggap pengguna datang dan pergi secara berkelanjutan: satu VU mengirim permintaan, memproses hasil, berpikir sejenak, lalu mengulang. <b>Model terbuka (open/arrival rate)</b> menganggap permintaan datang dari luar dengan laju tertentu, tanpa peduli apakah yang lama sudah selesai.',
    'Bab ini membedah cara menerjemahkan pertanyaan bisnis ("bagaimana kalau pengunjung naik 10 kali lipat jam 9 pagi?") menjadi konfigurasi k6 yang jujur: rumus praktis VU, peran think time, konversi grafik trafik nyata, resep lima jenis tes, dan daftar anti-pattern yang wajib dihindari.'
  ],
  objectives: [
    'Menjelaskan perbedaan model tertutup (VU-based) dan model terbuka (arrival rate)',
    'Menghitung perkiraan jumlah VU yang dibutuhkan dari target RPS dan durasi iterasi',
    'Menulis konfigurasi constant-arrival-rate yang benar beserta preAllocatedVUs dan maxVUs',
    'Menerjemahkan pola trafik nyata ke dalam stages dan memilih resep tes yang tepat'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Model Tertutup (Closed): Satu VU, Satu Siklus</h3><p>Pada <b>model tertutup</b>, setiap VU bertindak seperti satu pengguna yang duduk di depan aplikasi: ia mengirim permintaan, menunggu dan memproses hasil, <i>berpikir sejenak</i> (think time, misalnya membaca halaman), lalu mengirim permintaan berikutnya. Begitu seterusnya selama VU masih aktif. Karena itu jumlah permintaan per detik (RPS) yang dihasilkan <b>bergantung pada seberapa cepat respons server</b> — kalau server melambat, VU jadi lebih lama menunggu, dan RPS otomatis turun.</p><p>Kabar baiknya, hubungan antara VU, RPS, dan durasi iterasi bisa dirumuskan dengan sederhana. Berikut aturan praktis yang sering dipakai:</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Rumus Praktis Jumlah VU',
      lang: 'text',
      output: false,
      code: `Rumus:  VU dibutuhkan  ~  target RPS x rata-rata durasi iterasi (detik)

Contoh kasus:
  - Target throughput      : 100 request per detik
  - Rata-rata durasi iterasi: 1,5 detik  (termasuk think time)

Perhitungan:
  VU ~ 100 x 1,5 = 150 VU

Kalau kamu memangkas think time menjadi 0,5 detik saja:
  VU ~ 100 x 0,5 = 50 VU   (VU jauh lebih sedikit!)`,
      explain: [
        'Rumus ini berlaku untuk model tertutup: makin lama satu iterasi berjalan, makin banyak VU yang harus kamu siapkan untuk mencapai RPS yang sama.',
        'Perhatikan bahwa think time ikut menghitung. Memangkas "waktu berpikir" pengguna membuat tes terlihat butuh VU lebih sedikit, tetapi juga membuat tesnya tidak realistis — pengguna sungguhan membaca halaman, bukan menekan tombol secara robotik.',
        'Angka 1,5 detik pada contoh adalah hasil pengukuran (bisa dari <code>iteration_duration</code>), bukan tebakan. Selalu ukur dulu, baru hitung.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Model Terbuka (Open): Laju Kedatangan yang Dijamin</h3><p>Pada <b>model terbuka</b>, permintaan datang dari luar dengan laju (rate) tertentu, dan k6 berusaha memenuhi laju itu <b>terlepas dari seberapa lambat respons server</b>. Bila server melambat, iterasi menumpuk dan berjalan bersamaan — persis seperti pengunjung website sungguhan yang tetap datang walau server sedang tersendat.</p><p>Executor yang dipakai adalah <code>constant-arrival-rate</code>. Konfigurasi berikut menjamin 10 iterasi per detik selama 5 menit:</p>'
    },
    {
      type: 'example',
      title: 'Contoh: constant-arrival-rate dengan Alokasi VU Cukup',
      lang: 'javascript',
      output: false,
      code: `import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    trafik_tetap: {
      executor: 'constant-arrival-rate',
      startRate: 10,        // 10 iterasi mulai...
      timeUnit: '1s',       // ...setiap 1 detik
      duration: '5m',       // selama 5 menit
      preAllocatedVUs: 20,  // VU siap pakai yang disiapkan di awal
      maxVUs: 100,          // batas atas VU bila respons melambat
      gracefulStop: '30s',
    },
  },
};

export default function () {
  const res = http.get('https://api.example.com/products');
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(0.5); // think time singkat di dalam iterasi
}`,
      explain: [
        '<code>startRate: 10</code> dengan <code>timeUnit: \'1s\'</code> berarti k6 memulai 10 iterasi setiap detik. Ini mewakili trafik yang datang dari luar, bukan "VU yang mengirim request".',
        '<code>preAllocatedVUs: 20</code> adalah jumlah VU yang disiapkan di awal agar tidak ada jeda alokasi ketika iterasi baru mulai — membuat laju tetap mulus.',
        '<code>maxVUs: 100</code> adalah batas atas. Kalau respons server melambat dan iterasi menumpuk melebihi batas ini, k6 berhenti dengan pesan <b>"Insufficient VUs"</b>. Itulah alasan maxVUs harus disiapkan lebih besar daripada perkiraanmu.',
        'Rasio <code>maxVUs / startRate</code> memberi gambaran berapa lama server boleh melambat sebelum VU habis. Untuk 10 iterasi/detik, maxVUs 100 memberi "cadangan" sekitar 10 detik penumpukan.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Kapan Pakai Model Terbuka vs Tertutup</h3><p>Pilihan model menentukan apakah hasil tesmu valid. Berikut panduan singkatnya:</p><table><thead><tr><th>Pakai model tertutup (VU-based)</th><th>Pakai model terbuka (arrival rate)</th></tr></thead><tbody><tr><td>Aplikasi dengan sesi pengguna jelas: login, keranjang, checkout</td><td>Trafik konstan dari luar: webhook, API publik, integrasi pihak ketiga</td></tr><tr><td>Kamu ingin meniru "berapa banyak pengguna bersamaan yang sanggup ditangani"</td><td>Kamu ingin meniru "berapa pun lambatnya server, permintaan tetap datang dengan laju ini"</td></tr><tr><td>Hasil dipengaruhi kecepatan server (RPS turun saat lambat) — perilaku alami</td><td>Laju RPS dijamin konstan; tekanan tetap sama walau server tersendat</td></tr><tr><td>Mudah dipahami dan cocok untuk load test umum</td><td>Cocok untuk menguji ketahanan (stres) dan memodelkan lonjakan trafik</td></tr></tbody></table><p>Yang penting: keduanya bukan saingan, melainkan pelengkap. Banyak tim memakai model tertutup untuk load test harian dan model terbuka untuk menguji skenario stres atau lonjakan.</p>'
    },
    {
      type: 'text',
      html: '<h3>Think Time: Waktu Berpikir Pengguna yang Realistis</h3><p><b>Think time</b> (biasanya <code>sleep()</code>) meniru jeda antara dua tindakan pengguna: membaca halaman, mengisi form, memilih produk. Jeda ini penting karena dua alasan:</p><ul><li><b>Mempengaruhi jumlah VU</b> — seperti terlihat pada rumus, think time yang lebih lama membuat setiap iterasi lebih panjang, sehingga untuk RPS yang sama kamu butuh lebih banyak VU. Singkatnya, tanpa think time tes jadi tidak realistis dan terlalu "galak" pada server.</li><li><b>Mempengaruhi iteration_duration</b> — karena think time termasuk bagian iterasi, durasinya ikut terhitung. Kalau kamu membuat threshold pada <code>iteration_duration</code>, pastikan kamu sadar bahwa sleep ikut menambah angkanya.</li></ul><p>Nilai yang realistis umumnya 1–5 detik untuk aplikasi web, tergantung jenis halaman. Kuncinya: ambil dari pengamatan analytics bila ada, bukan dari tebakan. Dan ingat, untuk skenario arrival rate, sleep di dalam iterasi mempengaruhi berapa VU yang dibutuhkan, bukan laju kedatangan itu sendiri.</p>'
    },
    {
      type: 'text',
      html: '<h3>Menerjemahkan Pola Trafik Nyata</h3><p>Sekarang letak keindahannya. Kalau analytics menunjukkan trafik harian berbentuk gunung — pagi naik, siang puncak, malam turun — kamu bisa menirunya dengan <code>ramping-arrival-rate</code> dan beberapa tahap. Contoh berikut menaikkan laju dari 5 ke 50 per menit, menahannya, lalu menurunkannya kembali:</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Meniru Trafik Harian dengan ramping-arrival-rate',
      lang: 'javascript',
      output: false,
      code: `import http from 'k6/http';

export const options = {
  scenarios: {
    pola_harian: {
      executor: 'ramping-arrival-rate',
      timeUnit: '1m',
      startRate: 5,          // mulai dari 5 iterasi per menit
      preAllocatedVUs: 20,
      maxVUs: 200,
      stages: [
        { target: 50, duration: '5m' }, // pagi: trafik merangkak naik
        { target: 50, duration: '10m' },// siang: puncak ditahan
        { target: 5,  duration: '5m' }, // sore: perlahan surut
      ],
      gracefulStop: '30s',
    },
  },
};

export default function () {
  http.get('https://api.example.com/products');
}`,
      explain: [
        '<code>stages</code> pada <code>ramping-arrival-rate</code> berisi target <b>laju</b> (bukan jumlah VU) beserta durasinya, sehingga kamu bisa meniru naik-turunnya trafik harian dengan tepat.',
        '<code>startRate: 5</code> menjadi titik awal sebelum tahap pertama menaikkan laju ke 50 per menit; perhatikan <code>timeUnit: \'1m\'</code> yang menyelaraskan seluruh satuan.',
        'Karena puncaknya 50 iterasi per menit (sekitar 0,83 per detik), <code>maxVUs: 200</code> memberi cadangan besar bila server tersendat dan iterasi mulai menumpuk.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Resep Lima Jenis Tes</h3><p>Setiap jenis tes menjawab pertanyaan yang berbeda. Tidak ada gunanya menjalankan lima jenis tes bila kamu tidak tahu apa yang ingin dibuktikan. Berikut resep umum yang bisa kamu sesuaikan:</p><table><thead><tr><th>Jenis</th><th>Pertanyaan yang dijawab</th><th>Bentuk konfigurasi (contoh)</th></tr></thead><tbody><tr><td><b>Smoke</b></td><td>Apakah skrip dan aplikasi berfungsi normal?</td><td><code>vus: 5, duration: \'1m\'</code></td></tr><tr><td><b>Load</b></td><td>Apakah aplikasi sanggup menangani trafik harian yang diharapkan?</td><td>ramping-vus naik ke 50 VU dalam 15 menit, tahan, lalu turun</td></tr><tr><td><b>Stress</b></td><td>Di titik mana aplikasi mulai retak?</td><td>ramping-vus naik bertahap 75 → 150 VU</td></tr><tr><td><b>Spike</b></td><td>Bagaimana aplikasi bertahan pada lonjakan tiba-tiba?</td><td>ramping-vus melompat 5 → 100 VU dalam hitungan detik</td></tr><tr><td><b>Soak</b></td><td>Apakah ada kebocoran memori atau penurunan performa pelan?</td><td>konstan 20 VU selama 2 jam</td></tr></tbody></table>'
    },
    {
      type: 'example',
      title: 'Contoh: Smoke Test dan Spike Test Berdampingan',
      lang: 'javascript',
      output: false,
      code: `import http from 'k6/http';

export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 5,
      duration: '1m',      // cepat, murah, cukup untuk cek kesehatan dasar
    },
    spike: {
      executor: 'ramping-vus',
      startTime: '2m',     // mulai setelah smoke test selesai
      stages: [
        { target: 5,   duration: '30s' },
        { target: 100, duration: '30s' }, // lonjakan tiba-tiba
        { target: 100, duration: '2m' },
        { target: 5,   duration: '30s' },
      ],
      gracefulRampDown: '30s',
    },
  },
};

export default function () {
  http.get('https://api.example.com/products');
}`,
      explain: [
        '<b>Smoke</b> berjalan singkat di awal untuk memastikan skrip tidak salah konfigurasi sebelum tes besar membuang waktu dan sumber daya.',
        '<b>Spike</b> meniru lonjakan mendadak seperti flash sale atau tautan viral: kenaikan dari 5 ke 100 VU terjadi hanya dalam 30 detik, lalu bertahan sebentar sebelum turun.',
        '<code>startTime: \'2m\'</code> membuat spike berjalan setelah smoke selesai, sehingga kamu bisa mengamati keduanya berurutan dalam satu perintah.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Anti-Pattern yang Sering Terjadi</h3><p>Empat jebakan klasik yang membuat hasil tes tidak berguna:</p><ul><li><b>Mengubah banyak variabel sekaligus</b> — kalau kamu menaikkan VU sekaligus mengganti skrip dan versi aplikasi, kamu tidak akan pernah tahu apa yang menyebabkan perubahan hasil. Ubah satu variabel pada satu waktu.</li><li><b>Lupa menunggu pemanasan (warm-up)</b> — angka pada detik-detik pertama sering tidak stabil karena cache kosong, koneksi baru dibuat, dan JIT belum aktif. Sertakan tahap pemanasan sebelum mengukur.</li><li><b>Membandingkan hasil tanpa baseline</b> — angka p(95) 500 ms tidak berarti apa-apa tanpa tahu performa versi sebelumnya. Selalu simpan hasil run sehat sebagai pembanding.</li><li><b>Generator beban jadi bottleneck</b> — kalau mesin yang menjalankan k6 sendiri kehabisan CPU atau memori, angka yang dihasilkan tidak mencerminkan aplikasi, melainkan keterbatasan mesin pengujinya. Pantau pemakaian mesin pengujimu juga.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Catat Kurva dan Pertanyaannya Dulu',
      text: 'Sebelum menulis satu baris konfigurasi pun, tulis dua hal di atas kertas: (1) pertanyaan bisnis apa yang ingin dijawab ("apakah sanggup menangani 10.000 pengunjung saat promo?"), dan (2) bentuk kurva bebannya bagaimana (naik pelan lalu tahan? lonjak mendadak?). Dua catatan ini akan langsung menentukan pilihan model (terbuka/tertutup), executor, dan resep tes yang tepat — dan menghemat waktu percobaan yang sia-sia.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Jangan pernah menyimpulkan "aplikasi saya sanggup" hanya dari satu kali jalankan tes dengan variabel campur aduk dan tanpa acuan perbandingan. Hasil tes beban hanya bermakna bila dijalankan dengan <b>satu variabel yang diubah</b>, setelah masa <i>warm-up</i> yang cukup, dibandingkan terhadap <b>baseline</b> yang tersimpan, dan dengan keyakinan bahwa mesin pengujinya sendiri tidak menjadi bottleneck. Lewati satu saja syarat ini, dan angka yang kamu pamerkan bisa menyesatkan tim sendiri.'
    },
    {
      type: 'vocab',
      items: [
        ['Model tertutup (closed)', 'Model berbasis VU: satu VU mengirim permintaan, memproses, berpikir sejenak, lalu mengulang; RPS dipengaruhi kecepatan server.'],
        ['Model terbuka (open)', 'Model berbasis laju kedatangan: k6 menjaga jumlah iterasi mulai per unit waktu terlepas dari kecepatan respons server.'],
        ['Arrival rate', 'Laju kedatangan permintaan, dinyatakan sebagai jumlah iterasi mulai per unit waktu (misalnya 10 per detik).'],
        ['Think time', 'Jeda buatan (sleep) yang meniru waktu berpikir pengguna antar tindakan; memengaruhi jumlah VU yang dibutuhkan.'],
        ['RPS', 'Requests per second — jumlah request yang diselesaikan per detik; metrik paling sering jadi target kapasitas.'],
        ['Warm-up', 'Masa pemanasan di awal tes saat cache, koneksi, dan JIT belum stabil; sebaiknya belum dijadikan dasar pengukuran.'],
        ['Baseline', 'Hasil tes pada kondisi sehat yang disimpan sebagai acuan perbandingan untuk versi berikutnya.'],
        ['Soak test', 'Tes kepanjangan pada beban sedang untuk mendeteksi kebocoran memori dan penurunan performa yang pelan.']
      ]
    }
  ],
  recap: [
    'Model tertutup berbasis VU cocok untuk alur bersesi; VU ~ target RPS × durasi iterasi (detik), dan think time ikut menghitung dalam durasi iterasi.',
    'Model terbuka (constant-arrival-rate) menjamin laju kedatangan tertentu; preAllocatedVUs harus memadai dan maxVUs harus cukup besar agar tidak muncul "Insufficient VUs".',
    'Think time yang realistis membuat tes menyerupai pengguna sungguhan, meski menaikkan jumlah VU yang dibutuhkan untuk RPS yang sama.',
    'Pola trafik harian bisa ditiru dengan ramping-arrival-rate: target stages adalah laju kedatangan, bukan jumlah VU.',
    'Lima resep tes — smoke, load, stress, spike, soak — menjawab pertanyaan berbeda; hindari mengubah banyak variabel sekaligus, lupa warm-up, dan membandingkan tanpa baseline.'
  ]
});
