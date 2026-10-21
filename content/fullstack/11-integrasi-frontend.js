/* ============================================================
   Pelajaran Contoh Fullstack Microservices — Bab 11: Integrasi Frontend ↔ Backend
   ============================================================ */
'use strict';

window.FULLSTACK_LESSONS = window.FULLSTACK_LESSONS || [];

window.FULLSTACK_LESSONS.push({
  id: 'fs-integrasi-frontend',
  title: 'Integrasi Penuh: Satu Klik, Tiga Service, Lonceng Berbunyi',
  chapter: 'Frontend',
  duration: '16 menit',
  intro: [
    'Semua bagian sudah berdiri: backend, cache, broker, dan antarmuka. Bab ini adalah bab <b>perangkaian</b> — kita pasang dua wajah proxy (Vite saat pengembangan, nginx saat produksi), aktifkan lonceng notifikasi yang memeriksa dirinya sendiri tiap lima detik, lalu menguji satu rantai penuh dari klik tombol sampai angka di lonceng berubah.',
    'Inti teknis bab ini adalah satu detail yang sangat sering salah: bagaimana <code>/api/products</code> diterjemahkan menjadi <code>/products</code> di service tujuan. Konsepnya sederhana — hapus awalan <code>/api</code> — tetapi cara melakukannya di nginx punya jebakan sintaks yang membuat setiap permintaan diam-diam berpindah ke rute SPA dan membalas HTML kosong alih-alih data.',
    'Di akhir bab kamu punya checklist uji end-to-end yang bisa diulang kapan pun: buka browser, buat pesanan, dan amati seluruh rantai — nginx, tiga service Go, tiga database, Redis, RabbitMQ, konsumer, sampai lonceng — bekerja serentak di balik SATU alamat.'
  ],
  objectives: [
    'Menerjemahkan jalur /api/* ke tiga service lewat location nginx dengan sintaks proxy_pass yang benar',
    'Menerapkan aturan yang sama di proxy Vite mode pengembangan sehingga dev dan produksi identik',
    'Mengimplementasikan polling lonceng notifikasi dengan interval, cleanup, dan penanganan galat yang benar',
    'Menjelaskan mengapa satu origin menghapus masalah CORS beserta catatan header yang ikut diteruskan',
    'Menjalankan checklist uji end-to-end dari browser sekaligus memverifikasinya dengan curl',
    'Mendiagnosis gangguan integrasi umum: balasan HTML,301, CORS, dan angka lonceng yang basi'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Satu Klik, Lintas Komponen</h3><p>Berikut rekaman paling lengkap dari proyek ini: saat tombol <b>Buat Pesanan</b> ditekan di browser, terjadi rantai sinkron dan asinkron yang berjalan di lima wadah berbeda. Angka pada diagram adalah urutan kejadian, bukan urutan lokasi — perhatikan bagian bawah yang kembali ke browser: itulah polling yang akan membuat lonceng berdenyut dalam hitungan detik tanpa halaman dimuat ulang.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 295" width="760" role="img" aria-label="Rantai satu klik: browser ke nginx, order-service, product-service, RabbitMQ, notification-service, lalu polling lonceng kembali ke browser">
        <defs><marker id="mk-fs11-1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#94a3b8"/></marker></defs>
        <rect x="15" y="50" width="160" height="64" rx="8" class="u-hd"/>
        <text x="95" y="74" class="u-title">Browser (React)</text>
        <text x="95" y="96" class="u-lbl" text-anchor="middle">POST /api/orders</text>
        <rect x="215" y="50" width="140" height="64" rx="8" class="u-box"/>
        <text x="285" y="74" class="u-title">nginx :8080</text>
        <text x="285" y="96" class="u-lbl" text-anchor="middle">strip /api → /orders</text>
        <rect x="395" y="50" width="180" height="64" rx="8" class="u-box"/>
        <text x="485" y="74" class="u-title">order-service :8082</text>
        <text x="485" y="96" class="u-lbl" text-anchor="middle">validasi · INSERT · publish</text>
        <rect x="615" y="50" width="130" height="64" rx="8" class="u-hl"/>
        <text x="680" y="74" class="u-title">product-service</text>
        <text x="680" y="96" class="u-lbl" text-anchor="middle">:8081 — harga sah</text>
        <line x1="175" y1="82" x2="211" y2="82" class="u-line" marker-end="url(#mk-fs11-1)"/>
        <line x1="355" y1="82" x2="391" y2="82" class="u-line" marker-end="url(#mk-fs11-1)"/>
        <line x1="575" y1="82" x2="611" y2="82" class="u-line" marker-end="url(#mk-fs11-1)"/>
        <line x1="485" y1="114" x2="485" y2="176" class="u-line" marker-end="url(#mk-fs11-1)"/>
        <text x="497" y="150" class="u-lbl">publish</text>
        <rect x="405" y="180" width="160" height="56" rx="8" class="u-box"/>
        <text x="485" y="204" class="u-title">RabbitMQ</text>
        <text x="485" y="224" class="u-lbl" text-anchor="middle">order.created</text>
        <line x1="565" y1="208" x2="601" y2="208" class="u-line" marker-end="url(#mk-fs11-1)"/>
        <rect x="605" y="180" width="140" height="56" rx="8" class="u-hl"/>
        <text x="675" y="204" class="u-title">notification-service</text>
        <text x="675" y="224" class="u-lbl" text-anchor="middle">consumer → notification_db</text>
        <path d="M95,46 V18 H675 V176" class="u-line" marker-end="url(#mk-fs11-1)"/>
        <text x="380" y="36" class="u-lbl" text-anchor="middle">polling tiap 5 detik: GET /api/notifications → header X-Unread-Count mengisi lonceng</text>
        <text x="380" y="275" class="u-lbl" text-anchor="middle">semua lewat SATU origin (localhost:8080) — CORS tidak perlu dipusingkan</text>
        </svg></div><figcaption class="fig-cap"><b>Gambar 11.1</b> — Rantai lengkap satu klik: jalur sinkron (atas), jalur asinkron (bawah), dan polling yang menutup lingkaran</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Wajah Produksi: nginx Merangkai Tiga Service</h3><p>Di produksi, browser hanya mengenal satu alamat: <code>localhost:8080</code>. nginx melayani file hasil build React untuk semua rute aplikasi, lalu meneruskan jalur <code>/api/*</code> ke service yang berhak. Dua sintaks berikut adalah bagian paling gampang salah dari seluruh konfigurasi frontend:</p><p><b>Pertama</b>, location ditulis TANPA garis miring di akhir (<code>/api/products</code>, bukan <code>/api/products/</code>) agar <code>/api/products</code> tanpa belakangan juga cocok — bila memakai garis miring, permintaan tanpa garis miring jatuh ke rute SPA dan dibalas 301/HTML. <b>Kedua</b>, <code>proxy_pass</code> diberi URI tujuan (<code>...:8081/products</code>) sehingga bagian yang cocok diganti: <code>/api/products/1</code> menjadi <code>/products/1</code>. Tanpa URI di proxy_pass, nginx meneruskan URI asli utuh dan service menerima <code>/api/products/1</code> yang tidak ia kenal (404).</p>'
    },
    {
      type: 'example',
      title: 'nginx.conf: tiga location, tiga service',
      lang: 'text',
      output: false,
      code: `# Konfigurasi nginx untuk frontend:
#   /            → file hasil build React (SPA)
#   /api/products/*         → product-service:8081
#   /api/orders/*           → order-service:8082
#   /api/notifications/*    → notification-service:8083
# Dengan begini browser hanya bicara ke SATU alamat (origin yang sama)
# dan CORS tidak perlu dipusingkan.
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Akses log ditulis ke stdout/stderr container sehingga ikut terbaca
    # oleh podman compose logs frontend — arus pengunjung (jalur mana,
    # status berapa, berapa milidetik) tidak perlu dibuka lewat exec.
    access_log /dev/stdout;
    error_log /dev/stderr warn;

    # --- proxy ke product-service ---
    # location TANPA garis miring + proxy_pass ber-URI: bagian yang cocok
    # diganti oleh URI proxy — tanpa ini /api/products jatuh ke rute SPA.
    #   /api/products     → /products
    #   /api/products/1   → /products/1
    location /api/products {
        proxy_pass http://product-service:8081/products;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_connect_timeout 2s;
        proxy_read_timeout 10s;
    }

    # --- proxy ke order-service ---
    #   /api/orders → /orders ; /api/orders/1 → /orders/1
    location /api/orders {
        proxy_pass http://order-service:8082/orders;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_connect_timeout 2s;
        proxy_read_timeout 10s;
    }

    # --- proxy ke notification-service ---
    #   /api/notifications → /notifications ; .../5/read → /notifications/5/read
    location /api/notifications {
        proxy_pass http://notification-service:8083/notifications;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_connect_timeout 2s;
        proxy_read_timeout 10s;
    }

    # --- SPA React: semua rute lain diteruskan ke index.html ---
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Aset ber-hash boleh di-cache lama oleh browser; index.html jangan.
    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}`,
      explain: [
        'Di dalam jaringan compose, nama container = nama host: <code>product-service</code> langsung teresolusi oleh nginx tanpa IP apa pun — layanan yang berpindah port cukup diubah di satu tempat.',
        '<code>try_files ... /index.html</code> adalah janji SPA: mengakses <code>/products</code> langsung (tanpa lewat tombol menu) tetap menghasilkan aplikasi, bukan 404 — seluruh routing selesai ditangani React Router di sisi klien.',
        'Timeout pendek (<code>connect 2s</code>) membatasi kerusakan bila service tujuan sedang mati: pengguna cepat melihat galat, nginx tidak menumpuk koneksi.',
        '<code>access_log /dev/stdout</code> dan <code>error_log /dev/stderr warn</code> mengalirkan jejak nginx ke log container, sehingga arus pengunjung — jalur mana, status berapa, berapa milidetik — terbaca lewat <code>podman compose logs frontend</code> tanpa perlu exec ke dalam container mencari berkas log.',
        'Lokasi <code>/assets/</code> diberi <code>expires 30d</code> karena berkas hasil build Vite selalu ber-hash (misalnya <code>index-DhK3x9.js</code>): isi berubah = nama ikut berubah, jadi "immutable" aman. Lokasi ini juga menang lebih panjang daripada <code>location /</code>, jadi aset disajikan sebagai berkas sungguhan — bukan jatuh ke fallback SPA — sementara <code>index.html</code> tetap tanpa cache agar rilis baru langsung terbaca browser.'
      ]
    },
    {
      type: 'example',
      title: 'vite.config.js: aturan yang sama saat pengembangan',
      lang: 'javascript',
      output: false,
      code: `export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Yang dihapus hanya awalan /api; sisa jalur (/products, /orders, ...)
      // diteruskan persis ke service tujuan — sama seperti nginx di produksi.
      '/api/products': { target: 'http://localhost:8081', rewrite: (p) => p.replace(/^\\/api/, '') },
      '/api/orders': { target: 'http://localhost:8082', rewrite: (p) => p.replace(/^\\/api/, '') },
      '/api/notifications': { target: 'http://localhost:8083', rewrite: (p) => p.replace(/^\\/api/, '') }
    }
  }
});`,
      explain: [
        'Kesalahan klasiknya adalah menghapus SELURUH bagian yang cocok (<code>/api/products</code>) sehingga <code>/api/products</code> diteruskan sebagai <code>/</code> — server Go tidak punya rute <code>/</code> dan membalas 404 yang membingungkan.',
        'Dengan aturan "hapus hanya /api", satu fungsi rewrite melayani ketiga service dan tetap bekerja untuk sub-jalur seperti <code>/api/notifications/5/read</code>.',
        'Karena proxy berjalan di origin Vite yang sama, kode produksi maupun pengembangan mengirim permintaan ke <code>/api</code> tanpa perbedaan sedikit pun — tidak ada kondisi <code>if (dev)</code> di komponen.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Mengapa CORS Tidak Muncul di Proyek Ini</h3><p>CORS muncul ketika browser mengambil data dari <b>origin lain</b> (protokol + host + port berbeda). Di TokoKita, halaman dibuka dari <code>localhost:8080</code> dan semua data juga dari <code>localhost:8080</code> — origin tunggal, CORS tidak pernah aktif, tidak ada preflight <code>OPTIONS</code>. Inilah salah satu keuntungan terbesar pola reverse proxy: kompleksitas perizin-an lintas asal lenyap karena arsitekturnya, bukan karena disembunyikan.</p><p>Header khusus tetap perlu diketahui: <code>Idempotency-Key</code> (dibuat <code>orderApi.create()</code> memakai <code>crypto.randomUUID()</code>) diteruskan nginx ke order-service secara bawaan, dan balasan <code>X-Cache</code> beserta <code>X-Unread-Count</code> ikut dibalikkan ke browser — dua header itulah yang menghidupkan label cache di halaman Produk dan angka di lonceng.</p>'
    },
    {
      type: 'example',
      title: 'Lonceng: polling dengan pembersihan yang benar',
      lang: 'jsx',
      output: false,
      code: `const [unread, setUnread] = useState(0);

/* Polling ringan: cek lonceng tiap 5 detik. Untuk skala besar,
   lebih hemat memakai SSE/WebSocket. */
useEffect(() => {
  let hidup = true;
  async function cek() {
    try {
      const { unread: n } = await notificationApi.list();
      if (hidup) setUnread(n);
    } catch {
      /* service notifikasi mungkin sedang restart — abaikan */
    }
  }
  cek();                          // cek segera, tanpa menunggu interval pertama
  const t = setInterval(cek, 5000);
  return () => {
    hidup = false;
    clearInterval(t);             // WAJIB: cegah kebocoran interval
  };
}, []);

/* di dalam Sider & Header: */
{ key: '/notifications',
  icon: (
    <Badge count={unread} size="small">
      <BellOutlined />
    </Badge>
  ),
  label: 'Notifikasi' }`,
      explain: [
        'Angka lonceng TIDAK dihitung dari daftar yang diterima — ia datang dari header <code>X-Unread-Count</code> yang dihitung notification-service dari database. Klien hanya menampilkan angka otoritatif.',
        'Galat ditelan dengan sadar: selama notification-service direstart, polling tetap berjalan dan berhenti diam selama beberapa siklus — tidak ada layar merah untuk kegagalan sementara.',
        'Interval 5 detik berada jauh di atas durasi minimal panggilan (milidetik) sehingga tidak pernah tumpang-tindih; pembersihan <code>clearInterval</code> mencegah interval yatim yang terus memanggil setelah pengguna berpindah halaman.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Checklist Uji End-to-End</h3><p>Uji dilakukan dari dua arah: <b>browser</b> untuk memastikan pengalaman pengguna utuh, dan <b>curl</b> untuk memastikan setiap lapisan menjawab persis seperti yang dijanjikan. Jalankan berurutan — setiap langkah membutuhkan keberhasilan langkah sebelumnya.</p>'
    },
    {
      type: 'example',
      title: 'Uji dari browser: satu siklus penuh',
      lang: 'text',
      output: false,
      code: `1. Buka http://localhost:8080
   → halaman Produk termuat, baris "N produk (cache: HIT/MISS)" terlihat.

2. Muat Ulang dua kali
   → baris berganti HIT (Redis menyimpan daftar yang sama).

3. Tambah / ubah produk lewat tombol "Produk Baru"
   → pesan sukses muncul, tabel terisi ulang, cache kembali MISS lalu HIT.

4. Menu Pesanan → isi pelanggan, pilih produk, qty → "Buat Pesanan"
   → pesan "Pesanan #N dibuat — total Rp..." muncul; baris baru di tabel.

5. Dalam hitungan detik, lonceng di header menampilkan angka (badge merah)
   → notifikasi hasil konsumsi RabbitMQ sudah sampai.

6. Buka Notifikasi → baris terbaru berisi pesanan yang baru dibuat
   → "Tandai Dibaca" → angka lonceng berkurang.

7. Refresh halaman (F5)
   → angka lonceng konsisten (diambil ulang dari database, bukan memori).`,
      explain: [
        'Langkah 2–3 membuktikan dua sisi cache: baca dari Redis (HIT), tulis menghapus kunci (MISS lalu MISS→HIT pada baca berikutnya).',
        'Langkah 5 adalah satu-satunya bukti yang TIDAK bisa dipalsukan dengan menyimpan data di klien: angka itu lahir dari jalur RabbitMQ → consumer → database → header.',
        'Langkah 7 membedakan state semu (hilang saat refresh) dengan data sungguhan (ada di notification_db).'
      ]
    },
    {
      type: 'example',
      title: 'Uji dari curl: memeriksa tiap lapisan',
      lang: 'bash',
      output: false,
      code: `# 1) Proxy benar = JSON datang lewat :8080 (bukan HTML, bukan 301/404)
curl -i http://localhost:8080/api/products | head -3      # HTTP/1.1 200 + X-Cache
curl -s  http://localhost:8080/api/products/1             # objek produk tunggal

# 2) Order lewat proxy membawa Idempotency-Key
curl -i -X POST http://localhost:8080/api/orders \\
  -H 'Content-Type: application/json' \\
  -H 'Idempotency-Key: uji-browser-1' \\
  -d '{"product_id":1,"qty":2,"customer":"Budi"}'          # HTTP/1.1 201 Created

# 3) Notifikasi datang + angka lonceng di header
sleep 2
curl -si http://localhost:8080/api/notifications | grep -iE 'HTTP|x-unread'

# 4) Tandai dibaca → 204, lalu hitungan berkurang
#    id diambil dari daftar yang ada sekarang, bukan ditulis mati
ID=$(curl -s http://localhost:8080/api/notifications | sed -E 's/.*"id":([0-9]+).*/\\1/;q')
curl -si -X PATCH http://localhost:8080/api/notifications/$ID/read | head -1

# 5) Deteksi kesalahan tersembunyi: balasan HARUS application/json
curl -sI http://localhost:8080/api/products | grep -i content-type`,
      explain: [
        'Tanda pertama integrasi rusak adalah <code>Content-Type: text/html</code> pada jalur /api — artinya permintaan jatuh ke rute SPA (<code>try_files</code>) karena location tidak cocok.',
        '<code>301</code> pada <code>/api/products</code> hampir selalu berarti location ditulis dengan garis miring di akhir — diagnosis sesaat untuk kesalahan paling umum di bab ini.',
        'Langkah 3 mengecek dua hal sekaligus: rantai RabbitMQ bekerja (isi JSON) dan perhitungan belum-dibaca hidup (header).',
        'Langkah 4 mengambil id dari respons daftar saat itu juga, bukan menulis <code>/notifications/1/read</code> secara mati: id adalah milik data, bukan milik tebakan kita — bila satu-satunya notifikasi berid 7, atau langkah sebelumnya dilewat sehingga id 1 tidak pernah ada, perintah lama membalas 404 yang menyesatkan. Yang dihindari memang ketergantungan pada satu nomor id tertentu; langkah ini sendiri tetap mengandaikan langkah 2-3 berjalan sehingga daftar berisi, lalu 204 pada baris pertama berarti baris yang benar-benar ada itu berhasil ditandai dibaca.'
      ]
    },
    {
      type: 'tip',
      title: 'Polling yang Sopan',
      text: 'Lima detik adalah titik wajar untuk panel internal. Bila ingin lebih sopan, hentikan polling saat tab tersembunyi dengan <code>document.visibilityState</code> — browser modern memperlambat interval di tab latar belakang sendirinya, tetapi menghentikannya secara eksplisit menghemat permintaan nyata pada deployment yang ramai. Dan bila suatu saat kebutuhan real-time benar-benar muncul (chat, lelang), jalur penggantinya sudah tersedia dari materi RabbitMQ: SSE atau WebSocket dari satu service — tanpa mengubah cara halaman lain memanggil API.'
    },
    {
      type: 'warn',
      title: 'Satu Alamat Saja untuk Klien',
      text: 'Komponen frontend hanya boleh memanggil jalur relatif berawalan <code>/api</code>. Menyelipkan <code>http://localhost:8081</code> di dalam kode komponen membuat aplikasi pecah dua arah: langsung terkena CORS di produksi, dan gagal total ketika port berubah atau berjalan dari mesin lain. Alamat service adalah urusan konfigurasi server (nginx/Vite), bukan urusan tampilan.'
    },
    {
      type: 'vocab',
      items: [
        ['Reverse proxy', 'Server yang menerima permintaan atas nama penerimanya dan meneruskannya ke backend — di TokoKita nginx merangkai SPA dan tiga service Go di satu origin.'],
        ['Origin', 'Kombinasi protokol + host + port. Origin tunggal = setara = CORS tidak pernah aktif; pola /api di proxy menjaga semuanya tetap satu origin.'],
        ['CORS', 'Aturan peramban yang mengatur apakah situs boleh membaca respons lintas origin; disingkirkan arsitektur, bukan ditambahi header.'],
        ['Pola rewrite', 'Penggantian jalur permintaan sebelum diteruskan (nginx: location + proxy_pass ber-URI; Vite: fungsi rewrite) — intinya hanya "hapus awalan /api".'],
        ['SPA fallback (try_files)', 'Konfigurasi nginx yang membalas index.html untuk URL yang bukan berkas — mencegah 404 saat halaman diakses langsung lewat URL.'],
        ['Polling', 'Pengambilan berkala untuk menyamakan state klien dengan server; sederhana dan tahan proxy — di TokoKita tiap 5 detik memeriksa lonceng.'],
        ['Fan-out header', 'Mengirim data ringkas lewat header respons (X-Cache, X-Unread-Count) agar klien tidak perlu menghitung ulang dari isi badan respons.'],
        ['Interval leak', 'Kebocoran interval yang tidak dibersihkan saat komponen bongkar — dicegah dengan clearInterval di fungsi cleanup useEffect.'],
        ['Preflight (OPTIONS)', 'Pemeriksaan otomatis browser sebelum permintaan lintas-asal berbahaya; tidak pernah terjadi di TokoKita karena seluruh jalur satu origin.']
      ]
    }
  ],
  recap: [
    'nginx produksi memakai location TANPA garis miring + proxy_pass ber-URI sehingga /api/products → /products dan /api/products/1 → /products/1; tanpa keduanya permintaan jatuh ke SPA (301/HTML) atau 404.',
    'Proxy Vite menerapkan aturan identik (hapus hanya awalan /api) — kode frontend sama sekali tidak membedakan mode dev dan produksi.',
    'Satu origin menghapus CORS; header Idempotency-Key diteruskan ke service, header X-Cache dan X-Unread-Count kembali ke browser.',
    'Lonceng memakai polling 5 detik dengan bendera hidup + clearInterval, menampilkan angka otoritatif dari header X-Unread-Count.',
    'Checklist uji dua jalur (browser 7 langkah + curl 5 lapisan) membuktikan seluruh rantai dari klik sampai konsumsi pesan.'
  ]
});
