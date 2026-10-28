/* ============================================================
   Pelajaran HTTP — Bab 19: Proyek Akhir — API Katalog Produk
   ============================================================ */
'use strict';

window.HTTP_LESSONS = window.HTTP_LESSONS || [];

window.HTTP_LESSONS.push({
  id: 'proyek-akhir',
  title: 'Proyek Akhir: API Katalog Produk',
  chapter: 'Proyek Akhir',
  duration: '30–45 menit',
  intro: [
    'Saatnya menyatukan seluruh materi menjadi satu API kecil yang bisa dijalankan, diuji, dan dijelaskan. Proyek akhir ini tidak menuntut framework besar; yang dinilai adalah keputusan HTTP: method, status, header, validasi, autentikasi, otorisasi, cache, batas resource, dan dokumentasi.',
    'Kamu boleh memakai Node.js, Go, Bun, Lucee, atau bahasa lain yang nyaman. Laboratorium HTTP di <code>examples/http-lab/</code> bisa menjadi referensi perilaku dan sumber pengujian. Jika memakai lab sebagai titik awal, tambahkan setidaknya satu kemampuan baru dan tuliskan keputusan desainmu, bukan hanya menyalin.',
    'Proyek disusun dalam empat milestone: kontrak API, implementasi CRUD, keamanan dan operasi, lalu pengujian dan dokumentasi. Setiap milestone punya bukti yang harus dikumpulkan. Di akhir, kamu seharusnya bisa mempertahankan setiap status code dan header yang dipilih.'
  ],
  objectives: [
    'Merancang kontrak API katalog produk yang konsisten dan terdokumentasi',
    'Mengimplementasikan CRUD, autentikasi, otorisasi, cache, dan batas resource',
    'Menulis pengujian integrasi untuk jalur sukses dan gagal',
    'Menyusun README, threat model singkat, dan bukti pengujian proyek'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Spesifikasi Minimum</h3><table><thead><tr><th>Area</th><th>Persyaratan</th></tr></thead><tbody><tr><td><b>Resource</b></td><td>Katalog produk dengan field <code>id</code>, <code>name</code>, <code>price</code>, <code>stock</code>, dan timestamp.</td></tr><tr><td><b>CRUD</b></td><td>GET koleksi, GET detail, POST, PUT/PATCH, DELETE dengan method dan status yang tepat.</td></tr><tr><td><b>Validasi</b></td><td>Nama 2–80 karakter, harga >= 0, stok bilangan bulat >= 0; error 422 dengan detail field.</td></tr><tr><td><b>Autentikasi</b></td><td>Login session cookie atau bearer token; logout mencabut akses.</td></tr><tr><td><b>Otorisasi</b></td><td>Hanya admin boleh membuat, mengubah, dan menghapus; user biasa hanya membaca.</td></tr><tr><td><b>CORS</b></td><td>Origin frontend spesifik, preflight benar, credentials hanya bila diperlukan.</td></tr><tr><td><b>Cache</b></td><td>Minimal satu endpoint dengan ETag dan 304; data pribadi memakai no-store.</td></tr><tr><td><b>Operasi</b></td><td>Rate limit, batas body, timeout, request ID, dan log terstruktur tanpa data sensitif.</td></tr><tr><td><b>Pengujian</b></td><td>Integration test untuk 200/201/204/400/401/403/404/409/422/429/304.</td></tr><tr><td><b>Dokumentasi</b></td><td>README berisi cara jalan, endpoint, contoh curl, konfigurasi, dan threat model singkat.</td></tr></tbody></table>'
    },
    {
      type: 'text',
      html: '<h3>Milestone 1 — Kontrak API</h3><p>Sebelum menulis kode, tulis kontrak di README atau file <code>openapi.yaml</code>. Untuk setiap endpoint, tentukan:</p><ul><li>Method dan path, termasuk parameter path/query.</li><li>Request header wajib, misalnya <code>Content-Type</code>, <code>Authorization</code>, atau <code>Idempotency-Key</code>.</li><li>Skema request dan response, termasuk contoh error.</li><li>Status code sukses dan gagal yang mungkin terjadi.</li><li>Aturan pagination, sorting, cache, dan otorisasi.</li></ul><p>Contoh ringkas:</p><pre><code>GET /products?page=1&amp;limit=20&amp;q=kopi\n→ 200 application/json\n→ Cache-Control: no-store\n\nPOST /products\nAuthorization: Bearer &lt;token admin&gt;\nContent-Type: application/json\nIdempotency-Key: &lt;unik&gt;\n→ 201 + Location: /products/{id}\n→ 401 / 403 / 409 / 415 / 422</code></pre>'
    },
    {
      type: 'example',
      title: 'Milestone 2 — Implementasi dan Uji Manual',
      lang: 'bash',
      output: false,
      code: `# 1) Jalankan API (contoh memakai lab sebagai referensi)
node examples/http-lab/server.js

# 2) Baca koleksi
curl -i 'http://localhost:8787/products?page=1&limit=2'

# 3) Login admin dan simpan token
TOKEN=$(curl -s -X POST http://localhost:8787/login \\
  -H 'Content-Type: application/json' \\
  -d '{"username":"admin","password":"admin123"}' \\
  | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).access_token))")

# 4) Buat produk
curl -i -X POST http://localhost:8787/products \\
  -H "Authorization: Bearer $TOKEN" \\
  -H 'Content-Type: application/json' \\
  -H 'Idempotency-Key: proyek-001' \\
  -d '{"name":"Produk Proyek","price":50000,"stock":10}'

# 5) Uji validasi, konflik, dan method salah
curl -i -X POST http://localhost:8787/products \\
  -H "Authorization: Bearer $TOKEN" \\
  -H 'Content-Type: application/json' \\
  -d '{"name":"A","price":-1,"stock":1.5}'

curl -i -X PUT http://localhost:8787/products`,
      explain: [
        'Uji manual lebih dahulu untuk memahami perilaku sebelum menulis assertion otomatis. Catat status, header, dan body yang diharapkan.',
        'Gunakan akun dengan role berbeda untuk membuktikan otorisasi bekerja, bukan hanya autentikasi.',
        'Idempotency key harus unik per operasi bisnis. Mengulang key yang sama harus mengembalikan hasil yang sama, bukan membuat data baru.'
      ]
    },
    {
      type: 'example',
      title: 'Milestone 3 — Keamanan dan Operasi',
      lang: 'bash',
      output: false,
      code: `# Preflight CORS dari frontend yang diizinkan
curl -i -X OPTIONS http://localhost:8787/products \\
  -H 'Origin: http://localhost:8123' \\
  -H 'Access-Control-Request-Method: POST'

# Cache + ETag + 304
ETAG=$(curl -sI http://localhost:8787/cache | tr -d '\\r' \\
  | awk -F': ' 'tolower($1)=="etag"{print $2}')
curl -i http://localhost:8787/cache -H "If-None-Match: $ETAG"

# Rate limit
for i in 1 2 3 4 5 6; do
  curl -s -o /dev/null -w "%{http_code} " http://localhost:8787/rate
done
echo

# Body terlalu besar
node -e "process.stdout.write('x'.repeat(1200000))" > besar.bin
curl -i -X POST http://localhost:8787/upload \\
  -H 'Content-Type: application/octet-stream' \\
  --data-binary @besar.bin

# Timeout
curl -s -o /dev/null -w 'status=%{http_code}\\n' --max-time 1 \\
  'http://localhost:8787/slow?ms=3000'`,

      explain: [
        'Bukti keamanan harus berupa respons yang dapat diamati: preflight berhasil, 401/403 sesuai peran, 304 pada cache, 429 pada rate limit, dan 413 pada body besar.',
        'Setiap kontrol perlu diuji pada jalur gagal. Hanya menguji jalur sukses tidak membuktikan kontrol tersebut bekerja.',
        'Timeout dan batas resource melindungi server dari permintaan yang terlalu lama atau terlalu besar.'
      ]
    },
    {
      type: 'example',
      title: 'Milestone 4 — Pengujian dan Dokumentasi',
      lang: 'bash',
      output: false,
      code: `# Jalankan seluruh tes
node --test examples/http-lab/lab.test.js

# Cek sintaks semua file yang kamu ubah
node --check examples/http-lab/server.js
node --check examples/http-lab/lab.test.js

# Bukti akhir: simpan output tes dan contoh curl di README
# serta catat versi Node dan cara menjalankan.

# Struktur dokumentasi yang disarankan:
# README.md
#   - Ringkasan proyek
#   - Cara menjalankan & konfigurasi
#   - Tabel endpoint + status
#   - Contoh curl sukses dan gagal
#   - Keputusan cache, CORS, auth
#   - Threat model singkat
#   - Cara menjalankan tes
#   - Batasan yang diketahui`,

      explain: [
        'Output tes yang tersimpan menjadi bukti bahwa klaim di README dapat diverifikasi, bukan hanya deskripsi.',
        'Dokumentasi endpoint sebaiknya memuat contoh request dan response nyata, termasuk error, agar client tidak menebak.',
        'Threat model singkat cukup menjelaskan aset yang dilindungi, ancaman utama, kontrol yang ada, dan risiko yang belum ditangani.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Rubrik Penilaian</h3><table><thead><tr><th>Area</th><th>Bobot</th><th>Bukti yang dinilai</th></tr></thead><tbody><tr><td>Semantik method dan status</td><td>20%</td><td>CRUD konsisten, 201/204/401/403/404/409/422/429/304 digunakan dengan alasan.</td></tr><tr><td>Header, body, dan media type</td><td>15%</td><td>Content-Type, Accept, Location, ETag, Vary, error JSON konsisten.</td></tr><tr><td>Auth, otorisasi, dan CORS</td><td>20%</td><td>Token/session, role, preflight, credentials, dan origin spesifik.</td></tr><tr><td>Cache dan performa</td><td>15%</td><td>ETag/304, no-store untuk data privat, batas body, timeout.</td></tr><tr><td>Testing dan debugging</td><td>15%</td><td>Tes jalur sukses/gagal, bukti curl, log dengan request ID.</td></tr><tr><td>Dokumentasi dan observability</td><td>15%</td><td>README, contoh curl, threat model, metrik/log yang aman.</td></tr></tbody></table><p>Target minimal 80% dan tidak ada kelemahan kritis pada autentikasi atau otorisasi. Kelemahan kritis berarti endpoint sensitif dapat diakses tanpa identitas valid atau user biasa dapat melakukan aksi admin.</p>'
    },
    {
      type: 'tip',
      title: 'Cara Menyelesaikan dalam Empat Sesi',
      text: 'Sesi 1: tulis kontrak dan skema error. Sesi 2: implementasikan CRUD dan validasi. Sesi 3: tambahkan auth, otorisasi, CORS, cache, rate limit, serta batas body. Sesi 4: tulis integration test, README, threat model, dan jalankan seluruh bukti. Jangan menunda dokumentasi sampai akhir; tulis sambil memutuskan.'
    },
    {
      type: 'warn',
      title: 'Jangan Mengklaim Lebih dari yang Diuji',
      text: 'Jika proyek hanya diuji di localhost dengan HTTP, jangan menulis “siap produksi”. Nyatakan batasan: belum ada HTTPS, penyimpanan masih di memori, atau rate limit hanya lokal. Kejujuran tentang batasan adalah bagian dari kualitas rekayasa.'
    },
    {
      type: 'vocab',
      items: [
        ['Kontrak API', 'Kesepakatan eksplisit tentang request, response, status, dan perilaku API.'],
        ['Milestone', 'Tahap proyek dengan hasil dan bukti yang jelas.'],
        ['Acceptance test', 'Tes yang menentukan apakah kebutuhan proyek terpenuhi.'],
        ['Threat model', 'Ringkasan aset, ancaman, kontrol, dan risiko yang tersisa.'],
        ['Integration test', 'Tes yang menguji beberapa komponen bersama, termasuk HTTP dan penyimpanan.'],
        ['Observability', 'Kemampuan menelusuri keadaan sistem melalui log, metrik, dan trace.'],
        ['Batas resource', 'Batasan ukuran, waktu, dan laju untuk melindungi server.'],
        ['Definition of done', 'Kriteria yang harus terpenuhi sebelum pekerjaan dianggap selesai.']
      ]
    }
  ],
  recap: [
    'Proyek akhir menilai keputusan HTTP yang dapat dijelaskan, bukan jumlah fitur atau kerumitan framework.',
    'Kontrak API, implementasi CRUD, keamanan, pengujian, dan dokumentasi sebaiknya dikerjakan sebagai milestone yang terukur.',
    'Setiap kontrol keamanan dan operasi harus dibuktikan pada jalur gagal, bukan hanya jalur sukses.',
    'Dokumentasikan batasan proyek dengan jujur dan sertakan bukti pengujian yang dapat dijalankan ulang.'
  ]
});
