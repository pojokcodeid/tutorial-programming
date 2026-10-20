/* ============================================================
   Pelajaran Redis — Bab 15: Redis untuk Microservices
   ============================================================ */
'use strict';

window.REDIS_LESSONS = window.REDIS_LESSONS || [];

window.REDIS_LESSONS.push({
  id: 'microservices',
  title: 'Redis untuk Microservices',
  chapter: 'DevOps',
  duration: '12–14 menit',
  intro: [
    'Bayangkan gedung perkantoran dengan satu ruang arsip bersama di tengah. Bila setiap divisi bebas menaruh berkas apa pun di sana tanpa aturan, ruang itu dalam sebulan berubah menjadi gudang yang tak terbaca: berkas saling tertimpa, tidak ada yang tahu mana yang masih berlaku, dan satu arsipir yang keluar kamar membuat semua divisi berhenti bekerja. Banyak tim microservices justru terjebak pada cerita itu dengan Redis.',
    'Padahal, peran Redis di tengah banyak layanan justru paling bercahaya bila dipakai sesuai porsinya: <b>cache</b> yang memendekkan jalur baca, <b>idempotency key</b> yang membuat percobaan ulang tidak menggandakan order, <b>rate limiting terdistribusi</b> yang membuat aturan berlaku sama di seluruh instance, <b>state saga</b> yang mencatat langkah kompensasi, <b>pub/sub</b> untuk notifikasi ringan, serta <b>lock</b> singkat untuk kepemimpinan. Semuanya adalah data sesaat dan cepat, bukan kebenaran utama — kebenaran utama tetap berada di database masing-masing layanan.',
    'Bab ini membedah enam peran itu satu per satu lengkap dengan contoh perintahnya, lalu membahas jebakan paling mahal: Redis yang diam-diam berubah menjadi shared database antar layanan. Kamu akan melihat cara menata namespace dan ACL per layanan, menyusun peta nyata sebuah Order Management System, serta merancang degradasi terkendali agar layanan tetap hidup ketika Redis sedang tidak tersedia.'
  ],
  objectives: [
    'Menjelaskan peran Redis dalam arsitektur microservices: cache, idempotensi, rate limiting, state saga, pub/sub, dan lock',
    'Menerapkan idempotency key dengan SET NX serta rate limiting terdistribusi dengan INCR dan EXPIRE',
    'Membandingkan jaminan tiap pola Redis dengan batas yang melekat padanya',
    'Menata namespace dan ACL per layanan serta merancang degradasi terkendali saat Redis tidak tersedia'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Redis di Tengah Banyak Layanan</h3><p>Dalam arsitektur microservices, setiap layanan memiliki database sendiri dan bertanggung jawab penuh atas datanya. Tetap ada kebutuhan bersama yang tidak enak diselesaikan berulang di tiap layanan: tempat baca yang cepat, penghitung yang harus sama di banyak instance, penanda bahwa sebuah permintaan sudah pernah diproses, serta cara menyapa layanan lain tanpa membangun antrean berat.</p><p>Redis mengisi peran itu dengan syarat yang harus dipegang teguh: <b>apa pun yang disimpan di Redis harus bisa diproduksi ulang</b> dari sumber kebenaran layanan pemiliknya. Dengan syarat itu, Redis boleh hilang kapan saja tanpa kehilangan data berharga. Tanpa syarat itu, Redis diam-diam menjadi basis data bersama, dan seluruh manfaat pembagian tanggung jawab antar layanan runtuh seketika.</p><p>Sebelum masuk ke contoh, satu keputusan perlu disadari: <b>cache boleh dipisah per layanan, boleh juga dipakai bersama</b>. Cache per layanan memberi batas jelas siapa membaca dan menulis apa; cache bersama menghemat memori tetapi membuat satu layanan bisa memahami struktur data milik layanan lain. Praktik yang paling aman: <b>bersama hanya untuk data yang memang netral</b>, seperti sesi dan batas laju, sedangkan data domain tetap memakai namespace sendiri-sendiri.</p>'
    },
    {
      type: 'example',
      title: 'Idempotency Key dengan SET NX',
      lang: 'redis',
      output: false,
      code: `# Klien mengirim key idempoten yang sama untuk percobaan ulang yang sama
SET idem:order:9f3a71 diproses EX 86400 NX

# Percobaan pertama: key tercipta, proses bisnis diperbolehkan jalan
# Percobaan ulang: balasan (nil), layanan Wajib membalas hasil lama, bukan memproses lagi

EXISTS idem:order:9f3a71
TTL    idem:order:9f3a71

# Simpan ringkasan hasil agar permintaan ulang mendapat jawaban yang sama
SET hasil:order:9f3a71 '{"order_id":5071,"status":"diterima"}' EX 86400
GET  hasil:order:9f3a71`,
      explain: [
        '<code>SET ... NX</code> atomik: dari banyak permintaan paralel dengan key yang sama, hanya satu yang berhasil membuat key — hanya satu pula yang diperbolehkan memproses bisnis.',
        'Perintah <code>EX 86400</code> memberi umur 24 jam sehingga penanda dan hasilnya menghilang sendiri tanpa perlu jadwal pembersihan di layanan mana pun.',
        'Pola dua key, <code>idem:</code> dan <code>hasil:</code>, membuat percobaan ulang memperoleh jawaban yang sama seperti semula, bukan sekadar ditolak tanpa penjelasan.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Rate Limiting yang Berlaku bagi Semua Instance</h3><p>Layanan microservices hampir selalu berjalan lebih dari satu instance agar bisa menahan trafik dan tetap hidup bila satu node tumbang. Situasi ini membuat pembatasan laju menjadi rumit: bila tiap instance menghitung batasnya sendiri di memorinya, batas 100 permintaan per menit diam-diam berubah menjadi 100 dikali jumlah instance, dan angkanya kacau setiap kali node ditambah atau di-restart.</p><p>Redis menjadi titik hitung bersama yang menyelesaikan masalah ini dengan bersih. Cukup satu <code>INCR</code> atomik per permintaan, dan seluruh instance melihat angka yang sama. Karena jendela waktunya digabung dengan identitas klien, penghitungan tetap adil, dan <code>EXPIRE</code> memastikan kunci penghitung menghilang sendiri ketika jendela berganti.</p><p>Perlu satu catatan jujur: pendekatan ini tetap berbasis memori yang tersebar, bukan jam atomik. Perbedaan hitungan beberapa milidetik antar node bisa membuat penghitungan sedikit meleset di tepi jendela. Untuk batas kasar harian, hal itu tidak berarti; untuk kuota berbayar yang menuntut kepastian, pertimbangkan pengecekan tambahan di layanan penagihan.</p>'
    },
    {
      type: 'example',
      title: 'Rate Limiting Terdistribusi dengan INCR dan EXPIRE',
      lang: 'redis',
      output: false,
      code: `# Jendela 60 detik; 1015 adalah nomor jendela hasil pembagian timestamp
INCR   rl:api:abc123:1015
EXPIRE rl:api:abc123:1015 60

# Baca kuota terpakai untuk ditulis pada header respons
GET rl:api:abc123:1015
TTL rl:api:abc123:1015

# Nomor jendela berikutnya memakai kunci yang berbeda, jadi hitungan mulai lagi dari nol
INCR rl:api:abc123:1016
EXPIRE rl:api:abc123:1016 60

# Seluruh instance layanan memanggil Redis yang sama, sehingga batas benar-benar global`,
      explain: [
        'Kunci digabung dari identitas klien dan nomor jendela, sehingga tiap periode memiliki penghitung sendiri dan reset terjadi otomatis lewat <code>EXPIRE</code> tanpa campur tangan kursor pembersih.',
        '<code>INCR</code> berjalan atomik di dalam Redis: walaupun dua instance menulis pada detik yang sama persis, angkanya tidak pernah meleset maupun terlewat.',
        'Nilai <code>TTL</code> yang tersisa berguna untuk mengisi header <code>Retry-After</code>, sehingga klien tahu kapan ia boleh mencoba kembali tanpa perlu menebak.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Saga, Pub/Sub, dan Kepemimpinan Singkat</h3><p>Tiga kebutuhan berikutnya sering muncul bersamaan dalam sistem berbasis layanan, dan ketiganya punya jawaban ringkas di Redis dengan tingkat keandalan yang berbeda-beda.</p><ul><li><b>State saga</b> — pada transaksi yang tersebar di beberapa layanan, saga mencatat langkah mana yang sudah selesai dan langkah kompensasi mana yang harus dijalankan bila sebuah langkah gagal. Representasi ringkasnya berupa hash atau string dengan umur panjang, ditambah penanda status tiap langkah.</li><li><b>Pub/Sub untuk notifikasi ringan</b> — satu layanan cukup menerbitkan peristiwa singkat seperti <code>order.created</code>, dan layanan lain menyimaknya. Cocok untuk pemberitahuan yang boleh hilang tanpa menimbulkan kerugian.</li><li><b>Leader election singkat</b> — untuk pekerjaan yang hanya boleh dijalankan satu pihak, misalnya penjadwalan pembersihan berkala, satu <code>SET NX</code> dengan umur pendek menentukan pemimpin, dan pemimpin memperpanjang umurnya selama masih bertugas.</li></ul><p>Tabel berikut merangkum empat pola beserta jaminan dan batas yang melekat padanya. Membaca kolom terakhir dengan saksama jauh lebih penting daripada menghafal kolom keduanya.</p><table><thead><tr><th>Kebutuhan</th><th>Pola Redis</th><th>Jaminan dan batasnya</th></tr></thead><tbody><tr><td><b>Idempotensi</b></td><td>SET NX + TTL, dua key penanda dan hasil</td><td>Permintaan ganda diproses sekali; penanda hilang sendiri setelah TTL habis</td></tr><tr><td><b>Rate limiting</b></td><td>INCR + EXPIRE atau skrip Lua token bucket</td><td>Angka berlaku global bagi semua instance; tetap berbasis memori</td></tr><tr><td><b>State saga</b></td><td>Hash atau string berumur panjang dengan penanda status</td><td>Cepat dan murah; tetap database transaksi yang menjadi sumber kebenaran</td></tr><tr><td><b>Notifikasi</b></td><td>Pub/Sub ringan</td><td>Tanpa jaminan: pesan bisa hilang ketika subscriber sedang mati</td></tr><tr><td><b>Kepemimpinan</b></td><td>SET NX + TTL pendek yang diperpanjang pemimpin</td><td>Murah; bila pemimpin lalai memperpanjang, kepemimpinan berpindah</td></tr></tbody></table>'
    },
    {
      type: 'text',
      html: `<h3>Tiga Layanan, Satu Redis Bersama</h3><p>Gambar berikut memperlihatkan batas yang sehat: ketiga layanan berbagi satu Redis untuk keperluan sesaat, tetapi masing-masing tetap memegang MariaDB sendiri sebagai satu-satunya sumber kebenaran.</p><figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 310" width="760" role="img" aria-label="Tiga microservice order, inventory, dan notification terhubung ke satu Redis bersama dan masing-masing memiliki MariaDB sendiri">
        <text x="105" y="32" class="u-lbl" text-anchor="middle">sumber daya bersama</text>
        <text x="340" y="32" class="u-lbl" text-anchor="middle">microservices</text>
        <text x="565" y="32" class="u-lbl" text-anchor="middle">database per layanan</text>

        <rect x="20" y="45" width="170" height="195" rx="10" class="u-hl"/>
        <text x="105" y="78" class="u-title" text-anchor="middle">Redis</text>
        <text x="105" y="112" class="u-lbl" text-anchor="middle">cache bersama</text>
        <text x="105" y="140" class="u-lbl" text-anchor="middle">idempotency key</text>
        <text x="105" y="168" class="u-lbl" text-anchor="middle">rate limit terdistribusi</text>
        <text x="105" y="196" class="u-lbl" text-anchor="middle">pub/sub &amp; lock singkat</text>

        <rect x="250" y="45" width="180" height="55" rx="10" class="u-box"/>
        <text x="340" y="68" class="u-title" text-anchor="middle">order-service</text>
        <text x="340" y="88" class="u-lbl" text-anchor="middle">menerima &amp; memproses order</text>

        <rect x="250" y="115" width="180" height="55" rx="10" class="u-box"/>
        <text x="340" y="138" class="u-title" text-anchor="middle">inventory-service</text>
        <text x="340" y="158" class="u-lbl" text-anchor="middle">memegang stok gudang</text>

        <rect x="250" y="185" width="180" height="55" rx="10" class="u-box"/>
        <text x="340" y="208" class="u-title" text-anchor="middle">notification-service</text>
        <text x="340" y="228" class="u-lbl" text-anchor="middle">mengirim pemberitahuan</text>

        <line x1="194" y1="72" x2="244" y2="72" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="194" y1="142" x2="244" y2="142" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="194" y1="212" x2="244" y2="212" class="u-line" marker-end="url(#u-arrow)"/>

        <rect x="480" y="45" width="170" height="55" rx="10" class="u-box"/>
        <text x="565" y="68" class="u-title" text-anchor="middle">MariaDB orders</text>
        <text x="565" y="88" class="u-lbl" text-anchor="middle">kebenaran order</text>

        <rect x="480" y="115" width="170" height="55" rx="10" class="u-box"/>
        <text x="565" y="138" class="u-title" text-anchor="middle">MariaDB stok</text>
        <text x="565" y="158" class="u-lbl" text-anchor="middle">kebenaran inventaris</text>

        <rect x="480" y="185" width="170" height="55" rx="10" class="u-box"/>
        <text x="565" y="208" class="u-title" text-anchor="middle">MariaDB notifikasi</text>
        <text x="565" y="228" class="u-lbl" text-anchor="middle">kebenaran pesan</text>

        <line x1="434" y1="72" x2="474" y2="72" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="434" y1="142" x2="474" y2="142" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="434" y1="212" x2="474" y2="212" class="u-line" marker-end="url(#u-arrow)"/>

        <rect x="20" y="255" width="710" height="42" rx="10" class="u-box"/>
        <text x="375" y="281" class="u-lbl" text-anchor="middle">Redis dipakai bersama untuk data sesaat — data kebenaran tetap terpisah di MariaDB milik masing-masing layanan</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 15.1</b> — Redis sebagai sumber daya bersama (cache, idempotensi, rate limit) sementara setiap microservice tetap memegang MariaDB-nya sendiri</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Ketergantungan Berbahaya: Redis Berubah Jadi Shared Database</h3><p>Jebakan paling mahal terjadi tanpa disadari. order-service mulai menulis ringkasan pelanggan ke Redis; beberapa bulan kemudian notification-service membaca ringkasan itu langsung, tanpa lewat order-service, dan memakainya untuk menyapa pelanggan. Pada titik itu terjadi dua pelanggaran sekaligus.</p><p><b>Anti-pattern: menjadikan Redis basis data bersama antar layanan.</b> Pelanggaran pertama terhadap prinsip <i>database per service</i>: dua layanan kini berbagi skema, dan perubahan bentuk data oleh satu pihak langsung merusak pihak lain. Pelanggaran kedua, sumber kebenaran berpindah diam-diam ke memori sesaat yang bisa saja diusir oleh kebijakan eviction, sehingga data yang dianggap penting justru tidak punya jaminan kelangsungan hidup.</p><p>Tiga langkah pengaman yang membuat Redis kembali pada porsinya:</p><ul><li><b>Namespace per layanan</b> — setiap layanan memegang wilayahnya sendiri, baik lewat awalan kunci (<code>order:*</code>, <code>inv:</code>, <code>notif:</code>) maupun lewat nomor basis data (basis 0 untuk order, basis 1 untuk inventaris). Wilayah yang jelas membuat pembersihan dan penyelidikan menjadi mudah.</li><li><b>ACL khusus tiap layanan</b> — satu pengguna per layanan dengan pola kunci dan daftar perintah yang sempit. order-service tidak perlu menghapus kunci milik notification-service, dan percobaan itu akan tercatat bila pernah terjadi.</li><li><b>Layanan yang sanggup hidup tanpa Redis</b> — bila Redis tidak tersedia, jalur membaca jatuh ke database sendiri dan jalur menulis tetap dilayani, hanya saja lebih lambat. Inilah <i>degradasi terkendali</i>: pengguna merasakan perlambatan, bukan halaman rusak.</li></ul>'
    },
    {
      type: 'text',
      html: '<h3>Peta Order Management System</h3><p>Sebagai contoh konkret, perhatikan tata letak sebuah Order Management System. Ketiga layanan berbagi satu Redis, tetapi masing-masing memakainya untuk urusan yang berbeda dan tetap memegang MariaDB sendiri sebagai sumber kebenaran.</p><table><thead><tr><th>Layanan</th><th>Peran Redis</th><th>Contoh kunci</th><th>Sumber kebenaran</th></tr></thead><tbody><tr><td><b>order-service</b></td><td>Idempotensi pembuatan order, rate limit API, cache ringkas detail order, menerbitkan peristiwa</td><td><code>idem:order:*</code>, <code>rl:api:*</code>, <code>cache:order:*</code></td><td>MariaDB orders</td></tr><tr><td><b>inventory-service</b></td><td>Cache stok yang kerap dibaca dan lock singkat saat pengurangan stok</td><td><code>stock:sku:*</code>, <code>lock:stock:*</code></td><td>MariaDB stok</td></tr><tr><td><b>notification-service</b></td><td>Rate limit pengiriman dan cache preferensi pesan</td><td><code>rl:notify:*</code>, <code>pref:user:*</code></td><td>MariaDB notifikasi</td></tr></tbody></table><p>Perhatikan pola penulisannya: <code>jenis:objek:identitas</code>. Konvensi sederhana ini membuat pola kunci mudah dipasang pada ACL, mudah dipindai saat pembersihan, dan mudah dikenali ketika kamu membuka Redis tanpa membuka kode sumbernya. Untuk memindai kunci, pakai <code>SCAN</code> bertahap, bukan <code>KEYS</code> yang menahan server sampai seluruh ruang kunci terpindai.</p>'
    },
    {
      type: 'example',
      title: 'Penjaga Idempotensi dengan go-redis v9',
      lang: 'go',
      output: false,
      code: `package idempotency

import (
	"context"
	"errors"
	"time"

	"github.com/redis/go-redis/v9"
)

var ErrSibuk = errors.New("redis tidak tersedia, permintaan ditolak sementara")

// Guard menandai permintaan agar tidak diproses dua kali.
type Guard struct {
	rdb *redis.Client
	ttl time.Duration
}

func NewGuard(rdb *redis.Client) *Guard {
	return &Guard{rdb: rdb, ttl: 24 * time.Hour}
}

// Claim mengembalikan true bila key berhasil diklaim (permintaan pertama).
func (g *Guard) Claim(ctx context.Context, key string) (bool, error) {
	klaim, err := g.rdb.SetNX(ctx, "idem:order:"+key, "diproses", g.ttl).Result()
	if err != nil {
		return false, ErrSibuk
	}
	return klaim, nil
}

// Selesai menyimpan ringkasan hasil agar percobaan ulang mendapat jawaban sama.
func (g *Guard) Selesai(ctx context.Context, key, ringkasan string) error {
	return g.rdb.Set(ctx, "hasil:order:"+key, ringkasan, g.ttl).Err()
}`,
      explain: [
        '<code>SetNX</code> adalah perwujudan <code>SET NX</code> pada go-redis: ia mengembalikan satu nilai benar atau salah yang langsung menentukan apakah permintaan ini wajib diproses atau cukup dibalas dengan hasil lama.',
        'Umur 24 jam dipilih dari kebijakan bisnis, bukan dari kebiasaan; ia menentukan berapa lama percobaan ulang masih dianggap percobaan dari permintaan yang sama.',
        'Kegagalan Redis diterjemahkan menjadi <code>ErrSibuk</code> sehingga layanan mengambil keputusan secara sadar — menolak sementara dengan kode 503 pada jalur yang wajib idempoten — alih-alih diam-diam memproses dua kali.'
      ]
    },
    {
      type: 'tip',
      title: 'Beri Wilayah pada Setiap Layanan',
      text: 'Terapkan aturan penamaan <code>jenis:objen:identitas</code> dan pasang polanya ke ACL per layanan sejak awal, bukan setelah insiden. Wilayah yang jelas membuat siapa pun bisa menebak pemilik sebuah kunci hanya dengan melihat namanya, dan pembersihan berkala cukup memindai satu pola tanpa menyentuh wilayah tetangga.'
    },
    {
      type: 'warn',
      title: 'Pub/Sub Bukan Antrean Pesan',
      text: 'Pub/Sub Redis bersifat lepas tangan: ketika subscriber sedang mati, sedang di-deploy, atau koneksi terputus sejenak, pesan yang dikirim padanya hilang tanpa bekas. Jangan memakainya untuk pesan yang wajib sampai, seperti pembayaran atau penarikan stok — untuk itu gunakan stream dengan mekanisme konsumsi balik, atau message broker yang memang dirancang menahan pesan.'
    },
    {
      type: 'vocab',
      items: [
        ['Idempotency key', 'Kunci unik yang dikirim klien untuk menandai satu permintaan; memastikan percobaan ulang tidak menggandakan pekerjaan di layanan.'],
        ['SET NX', 'Perintah yang hanya berhasil menulis bila kunci belum ada, sehingga menjadi pengunci atomik untuk klaim pertama.'],
        ['Rate limiting terdistribusi', 'Pembatasan laju yang dihitung di satu Redis bersama sehingga aturannya sama bagi seluruh instance layanan.'],
        ['State saga', 'Catatan kemajuan transaksi yang tersebar di beberapa layanan, termasuk langkah kompensasi yang harus dijalankan bila sebuah langkah gagal.'],
        ['Pub/Sub', 'Mekanisme siaran pesan singkat tanpa penyimpanan; pesan hilang bila penerima sedang tidak terhubung.'],
        ['Leader election', 'Penentuan satu pelaksana untuk tugas tertentu lewat kunci yang hanya bisa dibuat satu kali dan harus diperpanjang berkala.'],
        ['Namespace kunci', 'Pembagian wilayah kunci per layanan, misalnya order:* dan inv:*, agar batas kepemilikan terlihat jelas.'],
        ['Degradasi terkendali', 'Keadaan ketika layanan tetap berfungsi walau Redis tidak tersedia, biasanya dengan jalur baca langsung ke database sendiri.']
      ]
    }
  ],
  recap: [
    'Redis berguna bagi microservices sebagai cache, idempotency key, rate limit terdistribusi, state saga, pub/sub, dan lock — selama isinya tetap bisa diproduksi ulang dari database layanan pemiliknya.',
    'Idempotensi diterapkan dengan SET NX plus TTL, sedangkan rate limiting memakai INCR dan EXPIRE agar batas berlaku global bagi seluruh instance.',
    'Setiap pola punya batasnya: pub/sub tanpa jaminan pengiriman, hitungan rate limit berbasis memori, dan state saga tetap bertumpu pada database transaksi sebagai kebenaran.',
    'Bahaya terbesar adalah Redis yang berubah menjadi shared database; cegah dengan namespace per layanan, ACL khusus tiap layanan, dan desain degradasi terkendali ketika Redis tidak tersedia.'
  ]
});
