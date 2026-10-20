/* ============================================================
   Pelajaran Contoh Fullstack Microservices — Bab 6: Cache Redis
   ============================================================ */
'use strict';

window.FULLSTACK_LESSONS = window.FULLSTACK_LESSONS || [];

window.FULLSTACK_LESSONS.push({
  id: 'fs-cache-redis',
  title: 'Cache Redis dengan Pola Cache-Aside',
  chapter: 'Backend Go',
  duration: '15 menit',
  intro: [
    'Daftar produk adalah endpoint paling sering dipanggil TokoKita — dibuka berulang oleh tabel halaman Produk, dropdown halaman Pesanan, bahkan polling dashboard. Setiap panggilan berarti query ke MariaDB. Bab ini menambahkan <b>lapisan Redis</b> di antaranya dengan pola <b>cache-aside</b>: coba baca dari cache lebih dulu, bila miss baru baca database lalu tulis hasilnya ke cache.',
    'Namun bagian terpenting dari bab ini bukan cara menyimpan — melainkan <b>cara menjaga kecocokan</b> antara Redis dan MariaDB. Kapan TTL diatur? Apa yang harus dibuang ketika produk diubah? Dan yang paling sering diremehkan: apa yang terjadi ketika Redis tiba-tiba mati di tengah jam operasional?',
    'Di akhir bab kamu akan memiliki cache yang benar-benar terbukti bekerja — dibuktikan oleh header <code>X-Cache: HIT</code> yang bisa kamu lihat sendiri dengan curl — beserta tiga keputusan desain yang membuatnya tetap jujur.'
  ],
  objectives: [
    'Menerapkan pola cache-aside pada pembacaan daftar dan detail produk dengan go-redis',
    'Memilih TTL yang tepat dan menjelaskan mengapa TTL bukan pengganti invalidasi',
    'Mengimplementasikan invalidasi dua sasaran (kunci produk + kunci daftar) pada setiap tulis',
    'Merancang degradasi terkendali sehingga kegagalan Redis tidak menggagalkan permintaan',
    'Membuktikan cache bekerja lewat header X-Cache dan memverifikasinya dengan curl'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Tiga Keputusan Sebelum Menulis Kode</h3><p>Cache yang salah desain lebih berbahaya daripada tanpa cache: ia menyajikan data basi, menumpuk memori, atau menolak melayani ketika dibutuhkan. Tiga keputusan ini diambil lebih dulu, lalu kode tinggal menerapkannya.</p>'
    },
    {
      type: 'example',
      title: 'Tiga keputusan desain cache TokoKita',
      lang: 'text',
      output: false,
      code: `1. APA YANG DI-CACHE?
   ✓ product:list      — seluruh daftar, satu blob JSON (dipakai tabel & dropdown)
   ✓ product:{id}      — detail satu produk
   ✗ operasi tulis     — tulis SELALU ke MariaDB, cache hanya dibuang

2. BERAPA LAMA? (TTL)
   daftar : 30 detik   — data yang sering berubah, biarkan segar sendiri
   detail : 30 detik   — satu nilai untuk kedua jenis, mudah direasone
   TTL adalah jaring pengaman KEDUA — yang pertama adalah invalidasi saat tulis.

3. APA YANG DILAKUKAN SAAT REDIS MATI?
   Semua metode cache diperlakukan sebagai "miss" → baca MariaDB.
   Layanan TETAP jalan, hanya lebih lambat. Tidak ada error ke frontend.`,
      explain: [
        'Keputusan 1 adalah inti cache-aside: aplikasi (bukan database) yang mengendalikan apa yang disimpan — berbeda dengan write-through di mana tulis melewati cache lebih dulu.',
        'Keputusan 3 menjawab pertanyaan wawancara klasik: "bagaimana kalau Redis down?" Jawaban TokoKita: degradasi terkendali, karena cache adalah pelengkap mutlak, bukan syarat hidup.',
        'Keputusan 2 paling sering disalahpahami: TTL TIDAK menggantikan invalidasi. Tanpa invalidasi saat tulis, pengguna mengubah harga lalu melihat harga lama selama 30 detik — inilah bug cache paling umum.'
      ]
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 348" width="760" role="img" aria-label="Alur cache-aside: tanya Redis, HIT langsung balas, MISS atau Redis mati membaca MariaDB lalu mengisi cache TTL 30 detik, dan invalidasi saat tulis">
        <defs><marker id="mk-fs06-1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#94a3b8"/></marker></defs>
        <rect x="280" y="15" width="200" height="42" rx="8" class="u-hd"/>
        <text x="380" y="41" class="u-title">GET /products</text>
        <line x1="380" y1="57" x2="380" y2="80" class="u-line" marker-end="url(#mk-fs06-1)"/>
        <rect x="280" y="80" width="200" height="48" rx="8" class="u-box"/>
        <text x="380" y="101" class="u-title">product:list</text>
        <text x="380" y="119" class="u-lbl" text-anchor="middle">ada di Redis?</text>
        <line x1="480" y1="104" x2="596" y2="104" class="u-line" marker-end="url(#mk-fs06-1)"/>
        <text x="538" y="96" class="u-lbl" text-anchor="middle">HIT</text>
        <rect x="600" y="82" width="150" height="50" rx="8" class="u-hl"/>
        <text x="675" y="104" class="u-title">balas dari cache</text>
        <text x="675" y="123" class="u-lbl" text-anchor="middle">X-Cache: HIT</text>
        <line x1="380" y1="128" x2="380" y2="158" class="u-line" marker-end="url(#mk-fs06-1)"/>
        <text x="394" y="147" class="u-lbl">MISS / Redis mati</text>
        <rect x="280" y="158" width="200" height="48" rx="8" class="u-box"/>
        <text x="380" y="179" class="u-title">MariaDB</text>
        <text x="380" y="197" class="u-lbl" text-anchor="middle">SELECT daftar produk</text>
        <line x1="380" y1="206" x2="380" y2="236" class="u-line" marker-end="url(#mk-fs06-1)"/>
        <rect x="280" y="236" width="200" height="56" rx="8" class="u-hl"/>
        <text x="380" y="258" class="u-title">isi Redis TTL 30 dtk</text>
        <text x="380" y="279" class="u-lbl" text-anchor="middle">balas: X-Cache: MISS</text>
        <rect x="15" y="308" width="730" height="34" rx="8" class="u-hd"/>
        <text x="380" y="330" class="u-lbl" text-anchor="middle">saat tulis (POST/PUT/DELETE): UPDATE database DULU → DEL product:{id} + product:list</text>
        </svg></div><figcaption class="fig-cap"><b>Gambar 6.1</b> — Alur cache-aside TokoKita: dua jalur baca (HIT/MISS) dan invalidasi yang terjadi setelah tulis</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Membaca: Sisi Pertama Cache-Aside</h3><p>Pola bacanya selalu sama untuk kedua jenis kunci: tanya Redis dulu; kalau jawabannya tidak ada atau tidak bisa dibaca, baca MariaDB lalu simpan hasilnya untuk permintaan berikutnya. Perhatikan bahwa <b>kegagalan Redis diperlakukan sama persis dengan miss</b> — inilah baris yang membuat degradasi terkendali bekerja tanpa percabangan di mana pun.</p>'
    },
    {
      type: 'example',
      title: 'Baca daftar produk dengan cache-aside',
      lang: 'go',
      output: false,
      code: `// list menampilkan semua produk; inilah yang paling sering diminta frontend
// dan paling diuntungkan oleh cache Redis.
func (a *API) list(w http.ResponseWriter, r *http.Request) {
	if list, ok := a.cache.GetDaftar(r.Context()); ok {
		w.Header().Set("X-Cache", "HIT") // bukti nyata cache bekerja
		writeJSON(w, http.StatusOK, list)
		return
	}
	// miss (atau Redis mati) → baca database
	list, err := a.store.List(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "gagal membaca produk")
		return
	}
	if list == nil {
		list = []store.Product{} // JSON [] bukan null
	}
	a.cache.SetDaftar(r.Context(), list, a.cacheTTL)
	w.Header().Set("X-Cache", "MISS")
	writeJSON(w, http.StatusOK, list)
}`,
      explain: [
        'Header <code>X-Cache</code> dipasang untuk transparansi: pengguna (dan kamu sendiri) bisa MELIHAT cache bekerja, bukan menebak-nebak. Header seperti ini sangat membantu ketika mengukur keberhasilan optimasi.',
        'Percabangan <code>ok</code> dari GetDaftar menutupi dua kasus berbeda (memang belum ada, atau Redis tidak bisa dihubungi) — keduanya berujung ke jalur yang sama: baca database. Pemilihan yang tepat.',
        '<code>list == nil → []</code> memastikan frontend selalu menerima array kosong <code>[]</code> saat katalog kosong, bukan <code>null</code> yang membuat <code>.map()</code> di JavaScript melempar galat.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Lapisan Cache: Galat Diam-Diam Menjadi Miss</h3><p>Di dalam paket <code>cache</code>, setiap metode menangkap galat Redis dan mengembalikan hasil miss. Pemanggil tidak pernah tahu apakah Redis sehat — dan memang tidak perlu tahu. Ini menjaga lapisan cache <b>transparan</b>.</p>'
    },
    {
      type: 'example',
      title: 'Lapisan cache go-redis: Get, Set, Invalidate',
      lang: 'go',
      output: false,
      code: `func keyProduk(id int64) string { return "product:" + strconv.FormatInt(id, 10) }

const keyDaftar = "product:list"

// GetProduk mengambil satu produk dari cache; false berarti miss.
// Perhatikan: err != nil (Redis mati, kunci kadaluarsa, redis.Nil)
// semuanya berujung pada "false" — galat diperlakukan sebagai miss.
func (c *Cache) GetProduk(ctx context.Context, id int64) (store.Product, bool) {
	val, err := c.rdb.Get(ctx, keyProduk(id)).Result()
	if err != nil {
		return store.Product{}, false
	}
	var p store.Product
	if json.Unmarshal([]byte(val), &p) != nil {
		return store.Product{}, false // isi korup → anggap miss, jangan sajikan
	}
	return p, true
}

// SetDaftar menyimpan seluruh daftar sebagai satu blob JSON dengan TTL.
func (c *Cache) SetDaftar(ctx context.Context, list []store.Product, ttl time.Duration) {
	data, err := json.Marshal(list)
	if err != nil {
		return // gagal serialisasi → lewati, database tetap sumber kebenaran
	}
	c.rdb.Set(ctx, keyDaftar, data, ttl)
}

// Invalidate membuang entri cache satu produk SEKALIGUS daftar lengkapnya,
// supaya tidak ada pembaca yang mendapat data basi setelah sebuah tulis.
func (c *Cache) Invalidate(ctx context.Context, id int64) {
	c.rdb.Del(ctx, keyProduk(id), keyDaftar)
}`,
      explain: [
        'Tiga titik kegagalan (network, redis.Nil, JSON korup) semuanya berujung "miss" — tidak ada satu pun yang meneruskan galat ke handler. Inilah bentuk paling murni dari degradasi terkendali.',
        'JSON korup dianggap miss, bukan error: lebih baik membaca database sekali daripada menyajikan data rusak ke pengguna.',
        '<code>Invalidate</code> menghapus DUA kunci sekaligus. Menghapus hanya <code>product:{id}</code> tetap meninggalkan daftar lama berisi harga lama — kebocoran konsistensi yang paling sering terlewat.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Menulis: Invalidasi di Titik yang Tepat</h3><p>Setiap handler tulis (create, update, delete) memanggil <code>a.cache.Invalidate(...)</code> setelah database sukses — dan tidak sebelumnya. Urutan ini penting: membuang cache sebelum tulis berarti pembaca berikutnya bisa mengisi ulang cache dengan data LAMA yang belum sempat berubah, dan kalian berdua tersesat bersama-sama.</p>'
    },
    {
      type: 'example',
      title: 'Anatomi handler update: database dulu, invalidasi kemudian',
      lang: 'go',
      output: false,
      code: `if err := a.store.Update(r.Context(), p); errors.Is(err, store.ErrNotFound) {
	writeError(w, http.StatusNotFound, "produk tidak ditemukan")
	return
} else if err != nil {
	writeError(w, http.StatusInternalServerError, "gagal mengubah produk")
	return
}
a.cache.Invalidate(r.Context(), id) // ← SETELAH database sukses
writeJSON(w, http.StatusOK, p)

/*  Urutan yang benar vs salah:

    ✓  DB update → cache delete → balas 200
       pembaca pertama setelah ini: MISS → baca data BARU → cache terisi baru

    ✗  cache delete → DB update → balas 200
       celah: pembaca di sela-sela bisa membaca data LAMA dari DB
       lalu mengisi cache dengannya — data basi bertahan penuh TTL!     */`,
      explain: [
        'Celah pada urutan yang salah disebut <b>race condition klasik cache</b>: bukan karena lupa menghapus, tapi karena menghapus di waktu yang keliru.',
        'Kegagalan setelah database sukses (misal Redis mati saat invalidate) tetap aman: kunci lama akan kadaluarsa sendiri oleh TTL dalam 30 detik — inilah fungsi TTL sebagai jaring pengaman kedua.',
        'Pada kasus <code>create</code>, ID produk belum diketahui sebelum insert; tetap memanggil Invalidate dengan ID baru tidak merugikan apa pun (kunci memang belum ada), dan yang terpenting <code>product:list</code> ikut dibuang.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Membuktikan Cache Bekerja</h3><p>Optimasi yang tidak bisa dibuktikan hanyalah asumsi. Karena setiap respons membawa header <code>X-Cache</code>, kamu bisa membuktikan cache bekerja dalam dua perintah — dan inilah yang akan kamu tunjukkan ketika ada yang bertanya "apa gunanya Redis di proyek ini?".</p>'
    },
    {
      type: 'example',
      title: 'Bukti nyata: MISS lalu HIT dalam dua panggilan',
      lang: 'bash',
      output: false,
      code: `# Panggilan 1 — database belum ada di cache
$ curl -si localhost:8081/products | head -4
HTTP/1.1 200 OK
X-Cache: MISS
Content-Type: application/json; charset=utf-8

# Panggilan 2 — kini dilayani Redis, TANPA menyentuh MariaDB
$ curl -si localhost:8081/products | head -4
HTTP/1.1 200 OK
X-Cache: HIT
Content-Type: application/json; charset=utf-8

# Buktikan dari sisi Redis langsung:
$ podman exec -it <container-redis> redis-cli GET "product:list"   # isi blob JSON
$ podman exec -it <container-redis> redis-cli TTL "product:list"   # sisa umur (dtk)
$ podman exec -it <container-redis> redis-cli DBSIZE               # jumlah kunci

# Setelah UPDATE produk, kunci harus HILANG (invalidasi bekerja):
$ curl -X PUT localhost:8081/products/1 -H 'Content-Type: application/json' \\
    -d '{"name":"Kopi Arabika Gayo","category":"minuman","price":95000,"stock":40}'
$ podman exec -it <container-redis> redis-cli DBSIZE               # lebih kecil

# Matikan Redis dan UJI DEGRADASI — service harus tetap melayani:
$ podman stop <container-redis>
$ curl -si localhost:8081/products | grep -E 'HTTP|X-Cache'         # tetap 200!
$ podman logs <product-service> | tail -2                           # PERINGATAN Redis
$ podman start <container-redis>`,
      explain: [
        'Tiga uji berurutan memverifikasi tiga klaim terpisah: cache terisi (HIT), invalidasi jalan (DBSIZE turun), dan degradasi bekerja (200 meski Redis mati). Setiap klaim punya buktinya sendiri.',
        'Uji "matikan Redis" adalah yang paling berharga: ia membuktikan asumsi desain bahwa cache bukan syarat hidup — diuji dengan menghilangkan komponennya, bukan dengan membaca kode.',
        'Perintah <code>redis-cli TTL</code> menunjukkan sisa umur kunci; angka yang menurun membuktikan TTL aktif bekerja, bukan sekadar deklarasi.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Kapan Cache Tidak Berhasil?</h3><p>Sejujurnya, untuk ukuran katalog TokoKita (lima produk), latensi MariaDB lokal sudah di bawah satu milidetik — manfaat cache ini terutama adalah <b>kebiasaan dan arsitektur yang benar</b>, yang baru terasa dampaknya ketika katalog tumbuh ke ribuan baris atau database digeser ke mesin lain. Karena itu, penting juga mengetahui kapan cache justru tidak banyak menolong, agar kamu tidak menganggapnya obat mujarab.</p>'
    },
    {
      type: 'example',
      title: 'Kapan cache kurang berdampak (dan apa alternatifnya)',
      lang: 'text',
      output: false,
      code: `SITUASI                          MENGAPA CACHE KURANG BERMANFAAT
─────────────────────────────────────────────────────────────────
Data selalu berubah tiap request  invalidasi tiap tulis → hit rate anjlok
                                   → ukur dulu, pertimbangkan no-cache
Permintaan unik tiap pengguna    kunci tidak pernah dipakai ulang
  (mis. /orders?user=X)          → cache menumpuk tanpa guna
Katalog sangat kecil (<100 baris) query sudah <1ms → perbedaan tak terasa
                                   → manfaat utamanya: melindungi database
                                   saat beban PUNCAK, bukan harian

YANG TERBUKTI BERMANFAAT DI TOKOKITA:
✓ melindungi MariaDB saat beban puncak (banyak tab membuka serentak)
✓ memperkekal respons ketika database direplikasi jarak jauh
✓ memaksa struktur kode punya lapisan cache yang rapi saat katalog tumbuh`,
      explain: [
        'Kalimat kunci: manfaat utama cache harian bukan kecepatan, melainkan <b>melindungi database dari beban puncak</b> — beban yang jarang tapi bisa menjatuhkan pelayanan.',
        'Pendekatan jujur seperti ini menjaga kamu dari dua ekstrem: menganggap cache wajib untuk segalanya, atau menganggapnya sia-sia lalu tidak pernah mengukurnya.',
        'Sebelum menambah cache baru di proyek nyata, selalu ukur dulu: <code>redis-cli INFO stats</code> menampilkan keyspace_hits — bila hit rate di bawah ~80%, desainnya perlu ditinjau ulang.'
      ]
    },
    {
      type: 'tip',
      title: 'Penamaan Kunci yang Mudah Dibersihkan',
      text: 'Pakai pola <code>jenis:identitas</code> yang konsisten: <code>product:123</code>, <code>product:list</code>, <code>session:abc</code>, <code>ratelimit:ip:1.2.3.4</code>. Dengan pola ini, membersihkan seluruh kunci produk cukup <code>redis-cli --scan --pattern "product:*" | xargs redis-cli DEL</code> — jauh lebih aman daripada <code>FLUSHDB</code> yang membuang semuanya.'
    },
    {
      type: 'warn',
      title: 'Jangan Jadikan Cache sebagai Satu-Satunya Sumber Data',
      text: 'Redis bisa kehabisan memori, mengusir kunci (eviction), atau restart kapan pun. Karena itu <b>jangan pernah menyimpan satu-satunya salinan data di cache</b> — terutama hasil perhitungan penting yang belum tersimpan di MariaDB. Semua yang TokoKita simpan di Redis adalah salinan yang boleh hilang tanpa peringatan: begitu cara berpikir ini dipegang, degradasi terkendali bukan lagi fitur, melainkan konsekuensi alami.'
    },
    {
      type: 'vocab',
      items: [
        ['Cache-aside (lazy loading)', 'Pola di mana aplikasi mengecek cache sendiri; data baru dimuat ke cache hanya ketika terjadi miss, dan tulis ke database selalu disertai pembuangan cache.'],
        ['TTL (Time to Live)', 'Umur sebuah kunci di Redis; otomatis dihapus begitu mencapai nol — jaring pengaman kedua setelah invalidasi eksplisit.'],
        ['Invalidasi', 'Pembuangan kunci cache setelah data aslinya berubah; dijalankan setelah database sukses, mencakup kunci detail DAN daftar.'],
        ['Cache hit / miss', 'Hit: permintaan terjawab dari cache. Miss: harus membaca database lalu mengisi cache untuk permintaan berikutnya.'],
        ['Header X-Cache', 'Header tambahan HIT|MISS pada respons yang membuat keberadaan cache bisa diverifikasi, bukan sekadar diyakini.'],
        ['Dekorasi galat', 'Menangkap semua jenis kegagalan (jaringan, kadaluarsa, isi korup) dan memperlakukannya seragam sebagai miss.'],
        ['Blob JSON', 'Menyimpan banyak data sebagai satu nilai JSON tunggal — cocok untuk daftar kecil; pada skala besar lebih baik per-item agar invalidasi lebih halus.'],
        ['Race condition cache', 'Kesalahan urutan (hapus cache sebelum tulis database) yang membuat data basi terisi kembali oleh pembaca di sela-sela.']
      ]
    }
  ],
  recap: [
    'Cache-aside: baca Redis lebih dulu; miss (atau Redis mati) → baca MariaDB lalu isi cache; tulis selalu ke database disertai invalidasi.',
    'TTL 30 detik dipakai untuk daftar dan detail sebagai jaring pengaman kedua — pengganti invalidasi yang TIDAK boleh dilakukan.',
    'Invalidate membuang kunci produk DAN kunci daftar sekaligus, dipanggil SETELAH database sukses untuk menutup celah race condition.',
    'Kegagalan Redis didekorasi menjadi miss di dalam lapisan cache: service tetap melayani 200 dari MariaDB (degradasi terkendali), dibuktikan dengan menghentikan container Redis.',
    'Header X-Cache HIT|MISS membuat cache bisa dibuktikan dengan curl; manfaat terbesarnya bagi TokoKita adalah melindungi MariaDB saat beban puncak.'
  ]
});
