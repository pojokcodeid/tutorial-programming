/* ============================================================
   Pelajaran Grafana k6 — Bab 2: Instalasi & Tes Pertama dengan k6
   ============================================================ */
'use strict';

window.K6_LESSONS = window.K6_LESSONS || [];

window.K6_LESSONS.push({
  id: 'instalasi-dasar-k6',
  title: 'Instalasi & Tes Pertama dengan k6',
  chapter: 'Pengenalan',
  duration: '8–10 menit',
  intro: [
    'Beberapa alat performance testing terasa seperti memasang perabotan kantor: berat, butuh instalasi panjang, lalu dikendalikan lewat antarmuka grafis yang menujunya ke mana-mana. k6 lahir dari kebalikannya — satu biner kecil yang kamu panggil dari terminal, hasilnya langsung terbaca di layar, dan seluruh konfigurasinya hidup di satu berkas JavaScript.',
    '<b>k6</b> adalah proyek open source dari <b>Grafana Labs</b>, ditulis dalam bahasa <b>Go</b> untuk mesin eksekusinya, dengan <b>JavaScript</b> sebagai bahasa penulisan skrip. Karena berjalan tanpa browser dan tanpa JVM, ia ringan: satu laptop mampu menghasilkan ribuan virtual user tanpa tersendat sendiri — bebanmu jatuh ke sistem yang diuji, bukan ke alat ukurnya.',
    'Bab ini membawamu dari nol sampai hijau: mengenal peta ekosistem k6, memasangnya di macOS, Windows, Linux, atau Docker, menulis skrip pertama, menjalankannya, lalu membaca ringkasan hasil beserta makna tiap blok — termasuk kode keluar yang menentukan hijau atau merah di CI.'
  ],
  objectives: [
    'Menjelaskan apa itu k6 dan posisinya dalam ekosistem Grafana',
    'Memasang k6 di sistem operasi masing-masing dan memverifikasi dengan k6 version',
    'Menulis dan menjalankan skrip smoke test pertama memakai k6/http dan check()',
    'Membaca ringkasan hasil, meng override lewat flag CLI, dan memahami exit code untuk CI'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Apa Itu k6 dan Peta Ekosistemnya</h3><p>k6 adalah alat <b>load testing</b> open source yang dijalankan dari baris perintah. Kamu menulis skrip JavaScript yang mendeskripsikan perilaku pengguna, k6 mengubahnya menjadi ribuan <b>virtual user</b>, lalu melaporkan latency, throughput, dan error dalam ringkasan yang mudah dibaca. Perbedaannya dengan JMeter sangat terasa: JMeter memakai GUI berbasis Java dengan berkas XML, sedangkan k6 sepenuhnya teks dan CLI — ramah bagi version control dan pipeline CI.</p><p>Kunci pemahaman: <b>mesinnya ditulis Go, skripnya JavaScript</b>. JavaScript di sini bukan Node.js — hanya sebagian kecil bahasa yang dipakai, dengan API milik k6 sendiri. Bab berikutnya membahas detailnya; untuk sekarang cukup ingat bahwa k6 menyediakan modul-modul khusus seperti <code>k6/http</code> alih-alih bebas memasang paket npm.</p><p>Peta ekosistem yang akan kamu temui:</p><ul><li><b>k6 OSS</b> — versi open source yang kamu pasang dan jalankan di mesin sendiri; seluruh materi ini memakainya.</li><li><b>Grafana Cloud k6</b> — layanan berbayar/gratis dari Grafana: hasil tes langsung tampil di Grafana, dan bisa ada <b>distributed execution</b> (tes dijalankan dari banyak wilayah) tanpa mengelola infrastruktur.</li><li><b>xk6 dan ekstensi</b> — toolchain untuk menambah kemampuan ke biner k6, misalnya klien database atau kripto tambahan, dengan bahasa Go atau JavaScript.</li><li><b>k6 Kubernetes Operator</b> — mengelola tes k6 sebagai beban (resource) di cluster Kubernetes; relevan saat tim yang banyak dan tes dijadwalkan otomatis.</li></ul>'
    },
    {
      type: 'example',
      title: 'Contoh: Memasang k6 di Berbagai Sistem',
      lang: 'bash',
      output: false,
      code: `# macOS (Homebrew)
brew install k6

# Windows (winget)
winget install k6

# Linux Debian/Ubuntu - repository resmi Grafana
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \\
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C549D4A5AF8BA418
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \\
  | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# Linux RHEL/Fedora - repository RPM
sudo rpm --import https://rpm.grafana.com/gpg.key
printf '[k6]\\nname=k6\\nbaseurl=https://dl.k6.io/rpm/\\nenabled=1\\ngpgcheck=0\\n' \\
  | sudo tee /etc/yum.repos.d/k6.repo
sudo dnf install k6 -y

# Docker (image resmi Grafana)
docker run --rm -i grafana/k6 version
docker run --rm -i -v "$PWD:/scripts" grafana/k6 run /scripts/smoke.js

# Cara darurat: unduh biner dari GitHub Releases dengan curl
curl -sL -o k6.zip https://github.com/grafana/k6/releases/download/v0.50.0/k6-v0.50.0-linux-amd64.zip
unzip k6.zip
sudo mv k6-v0.50.0-linux-amd64/k6 /usr/local/bin/k6

# Verifikasi di semua sistem - harus mencetak versi
k6 version`,
      explain: [
        'Pakai paket resmi milik Grafana kapan pun memungkinkan — <code>brew</code>, <code>winget</code>, repository <code>deb</code>/<code>rpm</code>, dan image <code>grafana/k6</code> semuanya dirilis bersama versi k6 resmi.',
        'Contoh nomor versi pada langkah <code>curl</code> hanya ilustrasi; <b>cek dokumentasi resmi untuk versi yang kamu pakai</b> dan ambil rilis terbaru dari halaman GitHub grafana/k6.',
        'Melalui Docker, peta berkas memakai <code>-v "$PWD:/scripts"</code> — skrip di folder saat ini dibacakan ke dalam container, sehingga kamu tidak perlu memasang apa pun di host.',
        '<code>k6 version</code> adalah langkah verifikasi wajib sebelum melangkah; bila perintah tidak ditemukan, biasanya PATH belum dimuat ulang setelah instalasi.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh: Skrip Pertama — smoke.js',
      lang: 'javascript',
      output: false,
      code: `import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 3,
  duration: '30s',
};

export default function () {
  const res = http.get('https://test.k6.io');

  check(res, {
    'status adalah 200': (r) => r.status === 200,
    'body memuat kata k6': (r) => String(r.body).toLowerCase().includes('k6'),
  });

  sleep(1);
}`,
      explain: [
        'Dua baris pertama adalah impor modul k6: <code>k6/http</code> untuk request, lalu <code>check</code> dan <code>sleep</code> dari modul inti <code>k6</code>.',
        '<code>options</code> menetapkan 3 virtual user yang berjalan selama 30 detik — inilah "beban awal" yang paling aman untuk pertama kali.',
        'Di dalam <code>default function</code>: kirim GET, tandai hasilnya dengan <code>check</code> (status 200 dan isi body), lalu <code>sleep(1)</code> meniru jeda manusia supaya tidak membanjiri server.',
        'Isi halaman <code>test.k6.io</code> bisa berubah sewaktu-waktu; bila check body tiba-tiba gagal, buka halamannya dan sesuaikan kata kunci pencarian.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh: Menjalankan Skrip dan Mengubah Beban dari CLI',
      lang: 'bash',
      output: false,
      code: `# Jalankan apa adanya (memakai options di dalam skrip)
k6 run smoke.js

# Timpa beban dari command line tanpa mengubah skrip
k6 run --vus 5 --duration 30s smoke.js

# Kirim konfigurasi lewat environment variable, dibaca sebagai __ENV.BASE_URL
k6 run -e BASE_URL=https://staging.example.com -e AUTH_TOKEN=rahasia123 smoke.js

# Mode tenang untuk log CI, sekaligus menyimpan hasil mentah
k6 run -q --out json=result.json smoke.js

# Lihat seluruh opsi yang terbaca dari skrip (tanpa menjalankan tes)
k6 inspect smoke.js`,
      explain: [
        'Flag CLI seperti <code>--vus</code> dan <code>--duration</code> <b>menimpa</b> nilai di blok <code>options</code> — cocok untuk menjalankan skrip yang sama dengan beban berbeda tanpa menyunting berkas.',
        '<code>-e NAMA=nilai</code> menaruh nilai ke <code>__ENV.NAMA</code> di dalam skrip; cara ini dipakai untuk URL lingkungan, token, dan konfigurasi lain yang berubah antar mesin.',
        '<code>-q</code> (<i>quiet</i>) mematikan baris progres sehingga log CI jauh lebih bersih; <code>--out json=file.json</code> menyimpan hasil mentah untuk diproses atau diarsipkan.',
        'Selalu mulai dengan durasi pendek dan VU kecil. Perintah yang sama dengan beban besar baru dijalankan setelah hasil kecil terbaca sehat.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh: Wujud Ringkasan Hasil (hipotetis)',
      lang: 'text',
      output: false,
      code: `  ✓ status adalah 200.......: 100% ✓ 90 ✗ 0
  ✓ body memuat kata k6.....: 100% ✓ 90 ✗ 0

=== SUMMARY ===

  http_req_duration......: avg=164.23ms min=88.05ms med=142.77ms max=612.40ms p(90)=247.61ms p(95)=301.88ms
    { expected_response:true }: avg=164.23ms min=88.05ms med=142.77ms max=612.40ms p(90)=247.61ms p(95)=301.88ms
  http_reqs.............: 270   8.99/s
  iterations............:  90   2.99/s
  iterations_failed.....:   0   0.00%
  checks................: 100% ✓ 180 ✗ 0
  data_received.........: 1.9 MB 63.4 kB/s
  data_sent.............:  57 kB  1.9 kB/s
  vus...................:   3   min=3 max=3
  vus_max...............:   3   min=3 max=3

=== ERRORS ===
(none)

iterasi 100% sukses · tidak ada error · 8.99 request per detik`,
      explain: [
        'Blok <b>http_req_duration</b> adalah jantung hasilnya: <code>avg</code>, <code>min</code>, <code>med</code>, <code>max</code>, <code>p(90)</code>, <code>p(95)</code> — semuanya milik metrik yang sama, dibaca dari kiri (rata-rata) ke kanan (ekor distribusi).',
        '<b>http_reqs</b> menunjukkan jumlah request sekaligus laju per detiknya (8.99/s), sedangkan <b>iterations</b> menghitung putaran <code>default function</code> — 90 iterasi dengan 270 request berarti 3 request per iterasi.',
        'Tabel <b>checks</b> dan blok <b>ERRORS</b> adalah tempat mengecek kebenaran isi respons; angka di blok metrik bisa terlihat sehat walaupun isinya salah.',
        'Bentuk ringkasan ini bisa berbeda antarversi k6 (format terminal berubah dari waktu ke waktu), jadi <b>cek dokumentasi resmi untuk versi yang kamu pakai</b> — yang tidak berubah adalah makna tiap metrik.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Mengapa Angka-Angka Itu Penting</h3><ul><li><b>http_req_duration</b> — latency per request. Mulai dari <code>p(95)</code>: "95% request lebih cepat dari ini". <code>med</code> memberi gambaran kasus biasa, <code>max</code> nyaris selalu ekstrem sehingga jangan dijadikan ukuran utama.</li><li><b>http_reqs</b> — throughput: berapa request selesai per detik. Bandingkan dengan baseline, bukan dengan angka abstrak.</li><li><b>iterations</b> dan <b>vus</b> — berapa kali skrip berjalan dan berapa pengguna tiruan yang aktif; keduanya memastikan beban benar-benar sesuai rencana.</li><li><b>checks</b> — rasio keberhasilan kriteria; <b>ERRORS</b> menampilkan kegagalan yang perlu kamu periksa lebih lanjut.</li></ul><h3>Exit Code: Penentu Hijau-Merah di CI</h3><p>Setiap kali k6 selesai, ia menutup prosesnya dengan <b>kode keluar</b> (exit code) yang langsung dibaca oleh shell, Make, atau Jenkins:</p><table><thead><tr><th>Kode</th><th>Arti</th><th>Makna di pipeline</th></tr></thead><tbody><tr><td><code>0</code></td><td>Tes selesai tanpa pelanggaran threshold</td><td>Lanjut ke tahap berikutnya (hijau)</td></tr><tr><td><code>99</code></td><td>Tes selesai, tetapi ada threshold yang dilanggar</td><td>Tahap tes dianggap gagal (merah)</td></tr></tbody></table><p>Karena itu threshold bukan sekadar hiasan: dialah yang membuat tes ikut menentukan lulus atau tidaknya sebuah deploy. Kode keluar lain bisa muncul pada kasus khusus seperti galat skrip; rincinya <b>cek dokumentasi resmi untuk versi yang kamu pakai</b>.</p><h3>Tiga Latihan Sebelum Lanjut</h3><ol><li>Ubah <code>duration</code> dari <code>30s</code> menjadi <code>2m</code>, jalankan lagi, dan amati bagaimana jumlah <code>iterations</code> bertambah sementara <code>vus</code> tetap.</li><li>Tambahkan satu kriteria check lagi, misalnya header <code>Content-Type</code> memuat <code>text/html</code>, lalu lihat barisnya muncul di tabel checks.</li><li>Hapus <code>sleep(1)</code> dan bandingkan <code>http_reqs</code> per detik sebelum sesudahnya — inilah gambaran nyata "tanpa jeda manusia".</li></ol>'
    },
    {
      type: 'tip',
      title: 'Tips Latihan yang Aman',
      text: '<code>https://test.k6.io</code> adalah <b>target latihan publik dari k6</b> yang memang disediakan untuk belajar — memakainya untuk latihan kecil adalah cara paling aman karena kamu tidak perlu khawatir merugikan siapa pun. Sediakan juga satu berkas khusus latihan (misalnya <code>smoke.js</code>) yang tidak pernah dipakai untuk tes sungguhan, sehingga perintah <code>k6 run</code> yang salah sasaran lebih mudah dihindari.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Jangan pernah mengarahkan tes ke <b>lingkungan produksi tanpa izin</b>, apalagi dengan VU besar pada percobaan pertama — latihan yang salah sasaran bisa membuat pelanggan sungguhan tidak bisa mengakses layanan. Mulailah selalu dari <b>VU kecil dan durasi pendek</b> (1–5 VU), periksa hasilnya, baru naikkan bertahap. Bila targetnya sistem orang lain atau layanan pihak ketiga, pastikan ada izin tertulis dan sudah ada rencana berhenti.'
    },
    {
      type: 'vocab',
      items: [
        ['k6', 'Alat load testing open source dari Grafana Labs; mesinnya ditulis Go, skripnya ditulis JavaScript.'],
        ['Smoke test', 'Tes paling ringan (1–5 VU, 1–2 menit) untuk memastikan aplikasi dan skrip sama-sama sehat.'],
        ['Virtual user (VU)', 'Pengguna tiruan yang menjalankan skrip selama durasi tes; diatur lewat options.vus.'],
        ['Flag CLI', 'Opsi baris perintah seperti --vus, --duration, -e, dan -q yang menimpa nilai di dalam skrip.'],
        ['__ENV', 'Objek berisi variabel lingkungan yang dikirim lewat flag -e, misalnya __ENV.BASE_URL.'],
        ['Threshold', 'Aturan kelulusan pada metrik; dilanggar membuat k6 keluar dengan kode 99.'],
        ['Exit code', 'Kode keluar proses k6: 0 berarti lolos, 99 berarti ada threshold yang gagal.'],
        ['Summary', 'Ringkasan hasil akhir di terminal berisi metrik, tabel checks, dan blok errors.']
      ]
    }
  ],
  recap: [
    'k6 adalah alat load testing open source dari Grafana Labs: mesin Go, skrip JavaScript, tanpa GUI — cocok untuk version control dan CI; ekosistemnya meliputi k6 OSS, Grafana Cloud k6, xk6, dan Kubernetes Operator.',
    'Instalasi tersedia via brew, winget, repository deb/rpm Grafana, dan image grafana/k6; verifikasi selalu memakai k6 version.',
    'Skrip pertama berisi import k6/http, blok options (vus + duration), default function dengan http.get, check, dan sleep(1); dijalankan dengan k6 run smoke.js.',
    'Ringkasan hasil dibaca dari http_req_duration (avg, min, med, max, p90, p95), http_reqs, iterations, vus, tabel checks, dan blok ERRORS.',
    'Exit code 0 berarti lolos dan 99 berarti ada threshold gagal — dua angka inilah yang menghubungkan k6 dengan pipeline CI.'
  ]
});
