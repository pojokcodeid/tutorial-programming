/* ============================================================
   Pelajaran HTTP — Bab 18: Pengujian dan Diagnosis Perilaku HTTP
   ============================================================ */
'use strict';

window.HTTP_LESSONS = window.HTTP_LESSONS || [];

window.HTTP_LESSONS.push({
  id: 'testing-diagnosis',
  title: 'Pengujian dan Diagnosis Perilaku HTTP',
  chapter: 'Debugging & Observability',
  duration: '15–17 menit',
  intro: [
    'API yang hanya diuji saat semuanya berjalan normal belum benar-benar diuji. Perilaku HTTP justru paling penting ketika input salah, token kedaluwarsa, upstream lambat, atau dua request datang bersamaan. Pengujian yang baik memeriksa status, header, body, dan efek samping, bukan hanya “apakah endpoint mengembalikan 200”.',
    'Ada beberapa tingkat pengujian: unit test untuk logika kecil, integration test untuk route dan database, contract test untuk kesepakatan antar-service, serta load test untuk perilaku di bawah beban. Setiap tingkat punya biaya dan manfaat berbeda. Menaruh semua keyakinan pada satu jenis tes biasanya meninggalkan celah.',
    'Bab ini menghubungkan pengujian dengan diagnosis: bagaimana membedakan kesalahan client, server, proxy, DNS, TLS, dan jaringan, serta bagaimana log, metrik, dan trace membantu menemukan penyebab. Kita akan memakai pengujian lab yang sudah tersedia dan menulis tes HTTP tambahan dengan <code>node:test</code>.'
  ],
  objectives: [
    'Menentukan cakupan unit, integration, contract, end-to-end, dan load test',
    'Menulis pengujian HTTP yang memeriksa status, header, body, dan efek samping',
    'Menguji jalur gagal: validasi, autentikasi, otorisasi, dan timeout',
    'Mendiagnosis sumber kegagalan berdasarkan log, metrik, trace, dan bukti jaringan'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Piramida Pengujian HTTP</h3><table><thead><tr><th>Jenis</th><th>Fokus</th><th>Contoh</th></tr></thead><tbody><tr><td><b>Unit test</b></td><td>Fungsi murni dan aturan kecil.</td><td>Validator harga, pembentuk error, parser query.</td></tr><tr><td><b>Integration test</b></td><td>Route, middleware, database, dan serialisasi.</td><td>POST /products membuat baris dan membalas 201.</td></tr><tr><td><b>Contract test</b></td><td>Kesesuaian bentuk request/response antar-service.</td><td>Consumer mengharapkan field <code>id</code> dan <code>price</code>.</td></tr><tr><td><b>End-to-end</b></td><td>Alur nyata dari client sampai dependency.</td><td>Login → buat pesanan → cek status.</td></tr><tr><td><b>Load test</b></td><td>Perilaku pada beban dan latency tertentu.</td><td>100 request/detik, ukur error rate dan p95.</td></tr></tbody></table><p>Integration test adalah titik seimbang untuk API: cukup nyata untuk menangkap kesalahan route dan header, tetapi cukup cepat untuk dijalankan di CI. End-to-end dipakai lebih sedikit karena mahal dan rentan gagal karena lingkungan.</p>'
    },
    {
      type: 'text',
      html: '<h3>Apa yang Harus Diperiksa</h3><ul><li><b>Status code</b> — 201 untuk create, 204 untuk delete, 401 tanpa token, 403 untuk role salah, 422 untuk validasi.</li><li><b>Header</b> — <code>Content-Type</code>, <code>Location</code>, <code>ETag</code>, <code>Cache-Control</code>, <code>Allow</code>, <code>Retry-After</code>, dan header CORS.</li><li><b>Body</b> — bentuk JSON, tipe field, pesan error, dan tidak adanya data sensitif.</li><li><b>Efek samping</b> — jumlah baris database, produk yang benar-benar dibuat, sesi yang dicabut.</li><li><b>Idempotensi</b> — request yang sama tidak menggandakan data.</li><li><b>Batas</b> — body terlalu besar, rate limit, timeout, dan input ekstrem.</li></ul><p>Tes yang hanya memeriksa status 200 mudah lolos meskipun header salah, body kosong, atau data sensitif bocor. Periksa kontrak secara eksplisit.</p>'
    },
    {
      type: 'example',
      title: 'Menjalankan Pengujian Lab',
      lang: 'bash',
      output: false,
      code: `# Semua tes lab: status, header, body, cookie, cache, CORS, range, proxy
node --test examples/http-lab/lab.test.js

# Tes tertentu berdasarkan nama
node --test --test-name-pattern='cache' examples/http-lab/lab.test.js

# Cek sintaks file sebelum menjalankan
node --check examples/http-lab/server.js
node --check examples/http-lab/lab.test.js

# Jalankan server lalu uji manual dengan curl
node examples/http-lab/server.js
curl -i http://localhost:8787/health`,

      explain: [
        'Tes lab memakai <code>node:test</code> dan <code>fetch</code> bawaan Node, tanpa dependensi tambahan, sehingga mudah dijalankan di komputer mana pun.',
        '<code>--test-name-pattern</code> membantu saat memperbaiki satu area tanpa menunggu seluruh suite.',
        'Pengujian otomatis tidak menggantikan eksplorasi manual. Gunakan curl untuk memahami perilaku sebelum menuliskannya sebagai assertion.'
      ]
    },
    {
      type: 'example',
      title: 'Menulis Tes HTTP Tambahan',
      lang: 'js',
      output: false,
      code: `'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createLabServer } = require('./server');

let server;
let base;

before(async () => {
  server = createLabServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = 'http://127.0.0.1:' + server.address().port;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('produk baru membalas 201, Location, dan JSON', async () => {
  const res = await fetch(base + '/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Produk Tes', price: 1000, stock: 2 })
  });

  assert.equal(res.status, 201);
  assert.match(res.headers.get('content-type'), /application\\/json/);
  assert.ok(res.headers.get('location'));

  const body = await res.json();
  assert.equal(body.name, 'Produk Tes');
  assert.equal(body.price, 1000);
});

test('tanpa token, profil membalas 401', async () => {
  const res = await fetch(base + '/profile');
  assert.equal(res.status, 401);
  assert.ok(res.headers.get('www-authenticate'));
});

test('body terlalu besar ditolak', async () => {
  const res = await fetch(base + '/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: 'x'.repeat(1024 * 1024 + 10)
  });
  assert.equal(res.status, 413);
});`,

      explain: [
        'Setiap tes memeriksa status, header, dan body. Ini menangkap regresi yang tidak terlihat jika hanya memeriksa “tidak error”.',
        'Server dijalankan di port acak (<code>listen(0)</code>) agar tes tidak bentrok dengan proses lain dan dapat berjalan paralel.',
        'Tes jalur gagal sama pentingnya dengan tes jalur sukses. Tanpa tes 401, 403, 413, dan 422, perubahan middleware bisa lolos tanpa terdeteksi.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Membedakan Sumber Kegagalan</h3><table><thead><tr><th>Gejala</th><th>Kemungkinan sumber</th><th>Bukti yang dicari</th></tr></thead><tbody><tr><td>Nama tidak ditemukan</td><td>DNS</td><td><code>time_namelookup</code>, hasil <code>dig</code>/<code>nslookup</code>.</td></tr><tr><td>Koneksi ditolak</td><td>Port, firewall, server mati</td><td><code>time_connect</code>, log listen, status port.</td></tr><tr><td>Sertifikat ditolak</td><td>TLS, hostname, expiry</td><td><code>curl -v</code>, <code>openssl s_client</code>.</td></tr><tr><td>401 berulang</td><td>Cookie/token tidak terkirim atau kedaluwarsa</td><td>Header request, isi cookie jar, waktu <code>exp</code>.</td></tr><tr><td>403</td><td>Otorisasi/role</td><td>Klaim token, aturan izin, log keputusan.</td></tr><tr><td>502</td><td>Upstream mati atau respons invalid</td><td>Log proxy, health check, konektivitas upstream.</td></tr><tr><td>504</td><td>Upstream lambat</td><td>Timeout proxy, durasi backend, dependency.</td></tr><tr><td>500</td><td>Bug atau dependency gagal</td><td>Stack trace internal, trace ID, metrik error.</td></tr></tbody></table>'
    },
    {
      type: 'tip',
      title: 'Observability yang Minimal tetapi Berguna',
      text: 'Catat request ID, method, path, status, durasi, dan hasil untuk setiap request. Tambahkan metrik tingkat error, latency p50/p95/p99, serta jumlah request. Gunakan trace untuk alur lintas service. Tiga hal ini sudah cukup untuk menjawab “apa yang terjadi, di mana, dan sejak kapan”.'
    },
    {
      type: 'warn',
      title: 'Jangan Merekam Body Sensitif',
      text: 'Body login, token, cookie, dan data pribadi tidak boleh masuk log mentah. Jika perlu debugging, gunakan sampling, redaksi, dan masa simpan terbatas. Log yang bocor bisa menjadi insiden keamanan tersendiri.'
    },
    {
      type: 'vocab',
      items: [
        ['Unit test', 'Tes untuk fungsi atau aturan kecil yang terisolasi.'],
        ['Integration test', 'Tes yang melibatkan route, middleware, dan dependency nyata atau tiruan.'],
        ['Contract test', 'Tes kesesuaian bentuk dan semantik request/response antar pihak.'],
        ['Load test', 'Pengujian perilaku sistem pada tingkat beban tertentu.'],
        ['Flaky test', 'Tes yang kadang lulus dan kadang gagal karena ketergantungan waktu atau lingkungan.'],
        ['Observability', 'Kemampuan memahami keadaan sistem dari log, metrik, dan trace.'],
        ['p95', 'Nilai latency yang 95% request berada di bawahnya.'],
        ['Fault injection', 'Sengaja memasukkan kegagalan untuk menguji ketahanan sistem.']
      ]
    }
  ],
  recap: [
    'Pengujian HTTP harus memeriksa status, header, body, efek samping, dan jalur gagal, bukan hanya respons sukses.',
    'Integration test dengan server nyata dan port acak memberi keyakinan tinggi tanpa bergantung pada lingkungan eksternal.',
    'Diagnosis perlu memisahkan DNS, konektivitas, TLS, HTTP, proxy, dan aplikasi berdasarkan bukti.',
    'Log, metrik, dan trace yang baik mempercepat diagnosis, tetapi data sensitif harus diredaksi.'
  ]
});
