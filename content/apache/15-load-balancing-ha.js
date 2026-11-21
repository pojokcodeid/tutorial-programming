/* ============================================================
   Pelajaran Apache — 15: Load Balancing & HA
   ============================================================ */
'use strict';

window.APACHE_LESSONS = window.APACHE_LESSONS || [];

window.APACHE_LESSONS.push({
  id: 'load-balancing-ha',
  title: 'Load Balancing & HA: Balancer, Algoritma, Failover',
  chapter: 'Load Balancing',
  duration: '12 menit',
  intro: [
    'Satu backend dengan kapasitas terbatas cepat atau lambat akan mencapai batasnya. Maka trafik dibagi ke beberapa backend — dan di sinilah Apache berperan ganda: bukan hanya meneruskan, tapi <b>membagi</b> dan <b>menjaga</b> layanan tetap hidup ketika satu mesin tumbang.',
    'Pelajaran ini membedah <code>balancer://</code>: cara mendeklarasikan member, memilih algoritma (<code>byrequests</code>, <code>bytraffic</code>, <code>bybusyness</code>), menyetel <code>retry</code> dan timeout per member, membuktikan distribusi round-robin di lab, sampai mensimulasikan kegagalan dan mengamati bagaimana Apache menyikapinya — termasuk batasan penting: Apache <b>tidak</b> mencoba member lain di dalam request yang sama.'
  ],
  objectives: [
    'Menulis blok <code>&lt;Proxy "balancer://..."&gt;</code> beserta <code>BalancerMember</code>',
    'Membedakan algoritma <code>byrequests</code>, <code>bytraffic</code>, dan <code>bybusyness</code>',
    'Menguji distribusi round-robin membuktikan dengan loop curl',
    'Mensimulasikan kegagalan backend dan membaca hasilnya (failover + kode error)',
    'Menjelaskan konsep HA: apa yang dicapai balancer, dan apa yang tetap menjadi titik gagal'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Mengapa balancer, bukan sekadar beberapa ProxyPass</h3><p>Bila menulis <code>ProxyPass /api http://b1</code> dan berharap Apache membagi sendiri, harapan itu tidak akan terpenuhi — satu rute ProxyPass menunjuk satu tujuan. Dibutuhkan entitas abstrak yang berisi banyak tujuan: <b>balancer</b>.</p><pre><code>&lt;Proxy "balancer://app_backend"&gt;\n    BalancerMember "http://backend-1:80" connectiontimeout=2 timeout=15\n    BalancerMember "http://backend-2:80" connectiontimeout=2 timeout=15\n    BalancerMember "http://backend-3:80" connectiontimeout=2 timeout=15\n    ProxySet lbmethod=byrequests\n&lt;/Proxy&gt;\n\n# lalu dipakai seperti tujuan biasa:\nProxyPass        "/api/" "balancer://app_backend/"\nProxyPassReverse "/api/" "balancer://app_backend/"</code></pre><p>Blok <code>&lt;Proxy&gt;</code> mendefinisikan <i>siapa saja yang boleh di-proxy</i> untuk skema itu sekaligus tempat konfigurasi balancer; <code>ProxyPass</code> mengikat path lokal ke skema balancer. Keduanya tidak bisa dipisahkan.</p>'
    },
    {
      type: 'text',
      html: '<h3>Tiga algoritma, tiga pertanyaan berbeda</h3><table><thead><tr><th>lbmethod</th><th>Memilih member yang...</th><th>Cocok untuk</th></tr></thead><tbody><tr><td><code>byrequests</code> (default)</td><td>Sedikit request selesai — setara round-robin bila semua member sama</td><td>Umum; beban per request seragam</td></tr><tr><td><code>bytraffic</code></td><td>Sedikit byte dipindahkan</td><td>Layanan dengan ukuran response berbeda-beda besar (unduhan, video)</td></tr><tr><td><code>bybusyness</code></td><td>Sedikit koneksi sedang aktif</td><td>Request dengan durasi bervariasi (ada yang cepat, ada yang lambat)</td></tr></tbody></table><p>Semua metode ini bersifat <b>passive health check</b>: Apache tidak mengirim probe berkala (fitur itu ada di Nginx Plus/HAProxy), melainkan menilai member dari hasil request nyata — member yang gagal ditandai error dan dilewati sementara.</p>'
    },
    {
      type: 'example',
      title: 'Membuktikan round-robin di lab',
      lang: 'bash',
      output: true,
      code: `# Kirim 12 request dan catat nama backend yang menjawab
for i in $(seq 1 12); do
  curl -s http://localhost:8080/api/ | grep -o 'backend-[0-9]' | head -1
done
# backend-1
# backend-2
# backend-3
# backend-1
# ... berulang bergantian

# Verifikasi dari sisi backend
podman logs --tail 3 backend-1
podman logs --tail 3 backend-2
podman logs --tail 3 backend-3`,
      explain: [
        'Dengan <code>byrequests</code> dan tiga member setara, urutan akan berputar 1→2→3→1... Ini bukti paling langsung bahwa konfigurasi balancer terbaca.',
        'Bila hasilnya selalu <code>backend-1</code>, kemungkinan: <code>lbmethod</code> tidak terbaca (balancer salah tulis), atau dua <code>ProxyPass</code> untuk path yang sama sehingga hanya yang pertama aktif.',
        '<code>podman logs</code> tiap backend adalah bukti kedua: tiap container menerima request — bukan sekadar nama yang berganti di body.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Atribut per member yang perlu kamu ketahui</h3><table><thead><tr><th>Atribut</th><th>Default</th><th>Fungsi</th></tr></thead><tbody><tr><td><code>timeout</code></td><td>ProxyTimeout (60s)</td><td>Batas menunggu respons member ini</td></tr><tr><td><code>connectiontimeout</code></td><td>Timeout</td><td>Batas membuka koneksi ke member</td></tr><tr><td><code>retry</code></td><td>60s</td><td>Setelah gagal, member dilewati selama durasi ini</td></tr><tr><td><code>lbset</code></td><td>0</td><td>Kelompok member; hanya satu kelompok dipakai per request (untuk aktif-pasif)</td></tr><tr><td><code>loadfactor</code></td><td>1</td><td>Bobot relatif; kombinasikan dengan <code>lbmethod=bybusyness</code> untuk member dengan kapasitas beda</td></tr><tr><td><code>route</code></td><td>—</td><td>Peta untuk <code>SessionRoute</code> — sticky session (lihat kotak di bawah)</td></tr></tbody></table><p>Semua atribut ini ditulis di <b><code>BalancerMember</code></b>, bukan di baris <code>ProxyPass</code> — mencantumkan <code>connectiontimeout=</code> di <code>ProxyPass balancer://</code> akan ditolak dengan <code>unknown Balancer parameter</code>.</p>'
    },
    {
      type: 'example',
      title: 'Mensimulasikan kegagalan (dan membaca hasilnya)',
      lang: 'bash',
      output: false,
      code: `# Skenario: satu backend mati
podman stop backend-1

# Kirim 8 request — amati polanya
for i in $(seq 1 8); do
  curl -s -o /dev/null -w '%{http_code} ' http://localhost:8080/api/
done
echo
# Hasil di lab: "500 200 200 200 200 200 200 200"
#  - request pertama bisa gagal: nama DNS backend-1 hilang (AH00898),
#    Apache tidak menggantikan member lain di dalam request yang sama
#  - member ditandai error (retry=60), request berikutnya aman

# Pulihkan
podman start backend-1
podman exec apache-lab httpd -k graceful`,
      explain: [
        'Angka pasti kegagalan pertama bisa bervariasi (500/503 tergantung timing), tapi <b>pola</b> yang harus kamu pahami: ada satu kegagalan → balancer menyingkirkan member → sisanya sehat.',
        'Bandingkan dengan Nginx <code>proxy_next_upstream</code>: Nginx OSS bisa mengulang request ke server berikutnya <i>di request yang sama</i>; Apache balancer tidak — klien menerima error, dan bergantung pada klien untuk mengulang.',
        'Setelah backend hidup lagi, <code>graceful</code> tidak wajib untuk fungsi (member akan kembali setelah jendela retry), tapi membuat resolusi dan kondisi awal bersih.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Apa yang dicapai HA — dan apa yang tidak</h3><table><thead><tr><th>Skenario</th><th>Ditangani balancer?</th><th>Catatan</th></tr></thead><tbody><tr><td>1 dari 3 backend mati</td><td>Ya, dengan satu request pertama bisa gagal</td><td>Bukti di lab: 500 lalu 200 terus</td></tr><tr><td>Semua backend mati</td><td>Tidak ada yang bisa menolong</td><td>Semua request 5xx — siapkan ErrorDocument</td></tr><tr><td>Apache sendiri mati</td><td>Tidak</td><td>Butuh dua Apache (keepalived/VRRP atau di belakang LB lain)</td></tr><tr><td>Koneksi lambat ke satu backend</td><td>Sebagian</td><td><code>timeout</code> pendek mencegah worker menumpuk</td></tr><tr><td>Deploy backend satu per satu</td><td>Ya</td><td>Inilah pola rolling deploy: cabut satu member, tunggu pulih, lanjut</td></tr></tbody></table><p>Kesimpulan: balancer menangani <b>kegagalan di level backend</b>, bukan ketersediaan gateway itu sendiri. Untuk HA penuh, diperlukan dua instance Apache di depan (atau DNS/LB eksternal) — topik yang biasanya diserahkan ke keepalived atau layanan cloud.</p>'
    },
    {
      type: 'tip',
      title: 'Uji failover secara berkala, simpan jadi skrip',
      text: '<p>Kegagalan yang tidak pernah diuji sama dengan tidak ada. <code>scripts/test-proxy.sh</code> melakukan persis itu: membagi request ke 3 backend, menghentikan satu lalu memverifikasi trafik tetap mengalir, mematikan seluruh backend lalu memastikan 5xx muncul, dan memulihkan semuanya lewat <code>trap</code>. Jalankan skrip yang sama sebelum dan sesudah setiap perubahan konfigurasi balancer — hasilnya adalah bukti bahwa rencanamu bekerja, bukan harapan.</p>'
    },
    {
      type: 'warn',
      title: 'Sticky session bukan pengganti stateless',
      text: '<p>Ada kalanya aplikasi menyimpan sesi di memori prosesnya sendiri, dan request berikutnya <b>harus</b> jatuh ke backend yang sama — inilah <code>route</code> + <code>ProxySet balancer=...</code> (sticky). Tapi ini mengikat skala: bila satu backend tumbang, sesinya ikut hilang, dan distribusi jadi timpang. Pola yang lebih sehat: pindahkan sesi ke tempat terpusat (Redis/database) agar setiap backend bisa melayani setiap request — baru round-robin bekerja penuh tanpa syarat tersembunyi.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['balancer://', 'Skema tujuan berisi kumpulan backend yang dibebani bersama.'],
        ['&lt;Proxy&gt;', 'Blok definisi tujuan proxy: daftar member + ProxySet balancer.'],
        ['BalancerMember', 'Satu backend dalam balancer beserta atribut timeout/retry/lbset-nya.'],
        ['lbmethod', 'Algoritma pemilihan: byrequests, bytraffic, bybusyness.'],
        ['retry', 'Durasi member yang gagal dilewati dari rotasi.'],
        ['Passive health check', 'Penilaian kesehatan dari request nyata, bukan probe terjadwal.'],
        ['Rolling deploy', 'Mengganti backend satu per satu tanpa memutus layanan.'],
        ['Sticky session', 'Menempelkan sesi klien pada satu member tertentu (route).']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Buktikan distribusi dengan 12 request (contoh di atas), lalu ubah <code>lbmethod</code> menjadi <code>bytraffic</code> dan ulangi — jelaskan perbedaan yang kamu harapkan dan bagaimana membuktikannya.</li><li>Hentikan <code>backend-2</code>, catat angka persis request pertama yang gagal dan statusnya, lalu bandingkan dengan ulangan kedua — cocokkan dengan kode <code>AH####</code> di log.</li><li>Tambahkan <code>loadfactor=3</code> pada satu <code>BalancerMember</code> dan jalankan <code>httpd -t</code> dulu untuk memastikan atributnya diterima dan hitung kemunculan tiap backend dalam 30 request — apakah distribusinya berubah?</li><li>Hentikan <b>ketiga</b> backend dan amati respons <code>/api/</code> vs halaman statis <code>/</code>. Jelaskan kenapa statis tetap 200 dan apa pelajarannya untuk kesiapan HA.</li></ol>'
    }
  ],
  recap: [
    'Balancer didefinisikan di <code>&lt;Proxy "balancer://..."&gt;</code> dengan <code>BalancerMember</code>, lalu dipakai sebagai tujuan <code>ProxyPass</code>.',
    '<code>byrequests</code> (default, setara round-robin), <code>bytraffic</code> (per byte), <code>bybusyness</code> (per koneksi aktif); health check-nya pasif.',
    'Atribut <code>timeout</code>/<code>connectiontimeout</code>/<code>retry</code> ditulis per <code>BalancerMember</code>; member gagal dilewati sementara, tapi request yang sedang berjalan tidak digantikan.',
    'Balancer mengatasi kegagalan backend, bukan kegagalan gateway; kegagalan harus diuji berkala — dan sesi sebaiknya disimpan terpusat agar distribusi bebas.'
  ]
});
