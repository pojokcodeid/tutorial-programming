/* ============================================================
   Pelajaran Redis — Bab 12: High Availability & Scaling
   ============================================================ */
'use strict';

window.REDIS_LESSONS = window.REDIS_LESSONS || [];

window.REDIS_LESSONS.push({
  id: 'high-availability',
  title: 'High Availability & Scaling',
  chapter: 'Operasional',
  duration: '12–14 menit',
  intro: [
    'Restoran kecil dengan satu dapur masih baik-baik saja selama kompor menyala. Tetapi bayangkan bila kompor itu mati di jam makan siang — tidak ada dapur cadangan, dan seluruh pesanan tertunda. Redis tunggal menghadapi risiko serupa: ia adalah <b>tunggal titik kegagalan</b>, secepat apa pun ia bekerja. Solusinya berjenjang, dimulai dari hal paling sederhana: buat <b>salinan hidup</b> (replica) yang selalu mengikuti master, sehingga bila mesin utama tumbang, ada penggantinya yang datanya sudah nyaris lengkap.',
    'Tetapi salinan saja tidak cukup: seseorang harus <b>memutuskan</b> kapan replica itu naik menjadi master baru, dan klien harus tahu bahwa alamat master sudah berpindah. Di situlah peran <b>Redis Sentinel</b> — tim pengawas kecil yang memantau kesehatan node, menjalankan <i>failover</i> secara otomatis, lalu memberi tahu aplikasi alamat terbaru. Kebutuhan lain yang muncul seiring waktu adalah <b>kapasitas</b>: satu mesin punya batas memori dan tulis. Untuk itu ada <b>Redis Cluster</b>, yang memecah data ke 16.384 <i>hash slot</i> sehingga beban tulis terbagi ke banyak master sekaligus.',
    'Bab ini menyusun ketiganya menjadi satu tangga keputusan: mulai dari <b>satu instance</b>, naik ke <b>replica</b> bila butuh salinan dan beban baca, lalu <b>Sentinel</b> ketika ketersediaan otomatis mulai dibutuhkan, dan <b>Cluster</b> bila memori atau tulis satu mesin benar-benar tidak lagi cukup. Tabel perbandingan, konfigurasi nyata, serta klien go-redis untuk ketiga mode akan kamu temukan di sepanjang bab ini.'
  ],
  objectives: [
    'Menjelaskan replikasi asinkron beserta risiko kehilangan data terbaru saat failover',
    'Mengonfigurasi Sentinel untuk pemantauan dan failover otomatis, lalu menghubungkannya lewat go-redis',
    'Memahami pembagian 16384 hash slot, hash tag, serta pesan MOVED dan ASK pada Redis Cluster',
    'Memilih antara satu instance, replica, Sentinel, dan Cluster sesuai kebutuhan ketersediaan dan skala'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Replikasi Asinkron: Master dan Replica</h3><p>Replikasi bekerja seperti pencatat rapat: satu orang berbicara (master), orang lain menyalin (replica) apa yang didengar. Perintahnya sangat sederhana — sebuah perintah <code>REPLICAOF</code> di replica membuatnya menarik seluruh data dari master, lalu terus mengikuti setiap perubahan berikutnya.</p><ul><li><b>Replica bersifat read-only</b> (<code>replica-read-only yes</code>) — tulisan hanya boleh ke master, sehingga salinan tidak pernah berbeda arah. Sebagian besar aplikasi membagi trafik: tulisan ke master, bacaan ke replica.</li><li><b>Penyalinan bersifat asinkron</b> — master tidak menunggu replica mengonfirmasi sebelum memberi tahu klien bahwa tulisan berhasil. Inilah sumber kecepatannya, sekaligus <b>sumber risikonya</b>: bila master mati tepat sebelum satu perintah terkirim ke replica, perintah itu hilang begitu failover terjadi.</li><li><b>Replication backlog</b> adalah antrean kecil di master berisi perintah terbaru; ia memungkinkan replica yang terputus sebentar menyusul tanpa harus menyalin ulang seluruh dataset.</li></ul><p>Untuk memperkecil risiko, Redis menyediakan <code>min-replicas-to-write 1</code>: master menolak tulisan bila tidak ada satu pun replica yang sedang menyusul. Tulisan sedikit lebih sering gagal, tetapi data yang dianggap berhasil dijamin sudah punya setidaknya satu salinan. Ini pertukaran klasik antara ketersediaan dan konsistensi.</p>'
    },
    {
      type: 'example',
      title: 'Menjalankan Replikasi dan Memeriksanya',
      lang: 'bash',
      output: false,
      code: `# --- cara 1: perintah dinatis (hilang bila Redis direstart) ---
redis-cli REPLICAOF 10.0.0.11 6379

# --- cara 2: permanen di redis.conf node replica ---
# replicaof 10.0.0.11 6379
# replica-read-only yes
# min-replicas-to-write 1
# min-replicas-max-lag 10

# Lihat posisi replikasi sekarang
redis-cli INFO replication
# role:master  connected_slaves:1
# slave0:ip=10.0.0.12,port=6379,state=online,offset=4821931,lag=0

# Putuskan replikasi (kembalikan node menjadi mandiri)
redis-cli REPLICAOF NO ONE

# Perintah lama yang masih didukung: menjadi salinan master lain
redis-cli SLAVEOF 10.0.0.11 6379`,
      explain: [
        'Nilai <code>offset</code> menunjukkan seberapa jauh replica sudah mengikuti master; <code>lag=0</code> berarti penyalinan berjalan sangat dekat, sedangkan lag yang terus membesar menandakan jaringan atau replica kewalahan.',
        '<code>REPLICAOF NO ONE</code> adalah kunci utama failover manual: replica yang diangkat menjadi master dengan perintah ini langsung berhenti menarik data dan mulai menerima tulisan.',
        'Konfigurasi pada berkas <code>redis.conf</code> dipilih untuk produksi karena tetap berlaku setiap kali container atau server dimulai ulang, berbeda dengan perintah dinatis.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Redis Sentinel: Pengawas yang Mengambil Keputusan</h3><p>Replikasi menyelesaikan masalah salinan, tetapi tidak menyelesaikan masalah <b>siapa yang memutuskan</b> saat master mati. Sentinel hadir untuk tiga tugas yang saling berkaitan:</p><ul><li><b>Memantau</b> — terus mengirim <code>PING</code> ke master dan replica; bila tidak dijawab dalam <code>down-after-milliseconds</code>, node itu dianggap <i>SUBJECTIVE DOWN</i>, dan bila mayoritas sentinel sepakat, menjadi <i>OBJECTIVE DOWN</i>.</li><li><b>Failover otomatis</b> — memilih replica terbaik (berdasarkan <code>replication offset</code> paling tinggi) untuk diangkat menjadi master, lalu menyuruh replica lain menyalin dari master baru.</li><li><b>Memberi tahu klien</b> — menyimpan alamat master aktif; klien Sentinel (seperti go-redis) menanyakannya lewat perintah <code>SENTINEL get-master-addr-by-name</code> alih-alih menulis alamat mati di konfigurasi.</li></ul><p>Nilai <code>quorum</code> menentukan berapa banyak sentinel yang harus sepakat bahwa sebuah node mati sebelum failover dijalankan. Di sini <b>jumlah ganjil sangat penting</b>: tiga sentinel dengan quorum 2 memungkinkan satu node mati tanpa mengganggu pengambilan keputusan, dan mencegah <i>split brain</i> di mana dua pihak sama-sama menganggap dirinya benar.</p>'
    },
    {
      type: 'example',
      title: 'Konfigurasi Sentinel dan Klien go-redis',
      lang: 'yaml',
      output: false,
      code: `# /etc/sentinel/sentinel.conf (ulangi identik di 3 node)
bind 0.0.0.0
port 26379
sentinel monitor mymaster 10.0.0.11 6379 2
sentinel down-after-milliseconds mymaster 10000
sentinel parallel-syncs mymaster 1
sentinel failover-timeout mymaster 60000
sentinel auth-pass mymaster KunciMasterRahasia
# jangan lupa: sentinel dijalankan dengan --sentinel
`,
      explain: [
        '<code>mymaster</code> adalah nama logis bebas yang menjadi kunci seluruh konfigurasi sentinel berikutnya dan menjadi nama yang ditanyakan klien saat mencari alamat master.',
        'Angka <code>2</code> di ujung baris <code>sentinel monitor</code> adalah quorum: minimal dua dari tiga sentinel harus menyatakan master mati sebelum failover dijalankan.',
        '<code>down-after-milliseconds 10000</code> memberi jeda 10 detik sebelum menilai node mati — cukup panjang untuk tidak memicu failover karena gangguan jaringan sesaat.'
      ]
    },
    {
      type: 'example',
      title: 'Menghubungkan Aplikasi ke Sentinel dan Cluster (go-redis v9)',
      lang: 'go',
      output: false,
      code: `package redisclient

import (
	"context"
	"fmt"

	"github.com/redis/go-redis/v9"
)

// Klien untuk mode Sentinel: master ditentukan sendiri oleh sentinel.
func NewSentinelClient() *redis.Client {
	return redis.NewClient(&redis.FailoverOptions{
		MasterName: "mymaster",
		SentinelAddrs: []string{
			"sentinel-1:26379",
			"sentinel-2:26379",
			"sentinel-3:26379",
		},
		Username:      "default",
		Password:      "KunciMasterRahasia",
		SentinelPassword: "KunciSentinelRahasia",
		ReplicaOnly:   false, // boleh baca dari replica bila didukung klien
	})
}

// Klien untuk mode Cluster: sebutkan beberapa alamat node, sisanya ditemukan.
func NewClusterClient() *redis.ClusterClient {
	return redis.NewClusterClient(&redis.ClusterOptions{
		Addrs: []string{
			"10.0.0.11:7000",
			"10.0.0.12:7001",
			"10.0.0.13:7002",
		},
		Username: "app",
		Password: "RahasiaCluster",
		ReadOnly: false,
	})
}

func Ping(ctx context.Context) error {
	s := NewSentinelClient()
	defer s.Close()
	if err := s.Ping(ctx, "").Err(); err != nil {
		return fmt.Errorf("sentinel tidak terjangkau: %w", err)
	}
	return nil
}`,
      explain: [
        '<code>FailoverOptions</code> membuat go-redis bertanya kepada sentinel siapa master aktif saat ini, sehingga kematian satu node tidak membuat aplikasi perlu di-restart.',
        'Daftar <code>SentinelAddrs</code> sebaiknya memuat ketiga sentinel; klien tetap bisa bekerja bila satu di antaranya mati, asalkan sisanya masih punya quorum.',
        'Pada <code>ClusterOptions</code>, cukup sebutkan beberapa alamat awal saja — go-redis akan menanyakan slot (<code>CLUSTER SLOTS</code>) dan menemukan seluruh node lainnya.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Dua Topologi yang Sering Berdampingan</h3>' + `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 340" width="760" role="img" aria-label="Topologi Redis Cluster dengan tiga master yang masing-masing punya satu replica beserta tiga Sentinel yang memantau master dan replica">
        <rect x="15" y="30" width="440" height="290" rx="10" class="u-box"/>
        <text x="235" y="54" class="u-title" text-anchor="middle">Redis Cluster — 16384 hash slot</text>
        <line x1="31" y1="64" x2="439" y2="64" class="u-line"/>

        <rect x="32" y="78" width="128" height="48" rx="8" class="u-hl"/>
        <text x="96" y="98" class="u-lbl" text-anchor="middle">Master 1</text>
        <text x="96" y="117" class="u-lbl" text-anchor="middle">slot 0–5460</text>

        <rect x="32" y="155" width="128" height="42" rx="8" class="u-box"/>
        <text x="96" y="181" class="u-lbl" text-anchor="middle">Replica 1</text>
        <line x1="96" y1="128" x2="96" y2="149" class="u-line" marker-end="url(#u-arrow)"/>

        <rect x="168" y="78" width="128" height="48" rx="8" class="u-hl"/>
        <text x="232" y="98" class="u-lbl" text-anchor="middle">Master 2</text>
        <text x="232" y="117" class="u-lbl" text-anchor="middle">slot 5461–10922</text>

        <rect x="168" y="155" width="128" height="42" rx="8" class="u-box"/>
        <text x="232" y="181" class="u-lbl" text-anchor="middle">Replica 2</text>
        <line x1="232" y1="128" x2="232" y2="149" class="u-line" marker-end="url(#u-arrow)"/>

        <rect x="304" y="78" width="128" height="48" rx="8" class="u-hl"/>
        <text x="368" y="98" class="u-lbl" text-anchor="middle">Master 3</text>
        <text x="368" y="117" class="u-lbl" text-anchor="middle">slot 10923–16383</text>

        <rect x="304" y="155" width="128" height="42" rx="8" class="u-box"/>
        <text x="368" y="181" class="u-lbl" text-anchor="middle">Replica 3</text>
        <line x1="368" y1="128" x2="368" y2="149" class="u-line" marker-end="url(#u-arrow)"/>

        <rect x="32" y="215" width="400" height="85" rx="8" class="u-box"/>
        <text x="232" y="240" class="u-title" text-anchor="middle">CRC16(key) mod 16384 = slot</text>
        <line x1="44" y1="250" x2="420" y2="250" class="u-line"/>
        <text x="232" y="270" class="u-lbl" text-anchor="middle">MOVED: slot sudah pindah -&gt; ikuti alamat baru</text>
        <text x="232" y="290" class="u-lbl" text-anchor="middle">ASK: migrasi sedang berjalan -&gt; tanya ke node tujuan</text>

        <rect x="490" y="30" width="255" height="290" rx="10" class="u-box"/>
        <text x="617" y="54" class="u-title" text-anchor="middle">Sentinel (quorum 2 dari 3)</text>
        <line x1="506" y1="64" x2="729" y2="64" class="u-line"/>

        <rect x="508" y="78" width="220" height="42" rx="8" class="u-hl"/>
        <text x="618" y="104" class="u-lbl" text-anchor="middle">Sentinel 1 (port 26379)</text>

        <rect x="508" y="135" width="220" height="42" rx="8" class="u-hl"/>
        <text x="618" y="161" class="u-lbl" text-anchor="middle">Sentinel 2</text>

        <rect x="508" y="192" width="220" height="42" rx="8" class="u-hl"/>
        <text x="618" y="218" class="u-lbl" text-anchor="middle">Sentinel 3</text>

        <rect x="508" y="255" width="220" height="50" rx="8" class="u-box"/>
        <text x="618" y="276" class="u-lbl" text-anchor="middle">memantau -&gt; failover otomatis</text>
        <text x="618" y="295" class="u-lbl" text-anchor="middle">memberi tahu klien alamat baru</text>

        <line x1="488" y1="150" x2="458" y2="150" class="u-line" marker-end="url(#u-arrow)"/>
      </svg></div><figcaption class="fig-cap"><b>Gambar 12.1</b> — Topologi Redis Cluster (tiga master dengan rentang slot dan masing-masing satu replica) berdampingan dengan tiga Sentinel yang memantau kesehatannya</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Redis Cluster: Membagi Data ke 16.384 Slot</h3><p>Satu mesin punya batas memori dan batas tulis. Redis Cluster mengatasinya dengan memecah dataset menjadi <b>16.384 hash slot</b>: setiap key dipetakan ke satu slot lewat rumus <code>CRC16(key) mod 16384</code>, lalu slot dibagi rata ke antar master. Karena perhitungannya murni aritmetika, klien mana pun bisa menghitung sendiri ke mana key tujuannya — tanpa perlu bertanya di setiap permintaan.</p><p>Tiga hal penting untuk dipahami:</p><ul><li><b>Hash tag</b> — bila key mengandung kurung kurawal, <b>hanya isi di dalamnya</b> yang dipakai menghitung slot. <code>user:42:profile</code> dan <code>user:42:cart</code> bisa saja mendarat di slot berbeda, tetapi <code>{user:42}:profile</code> dan <code>{user:42}:cart</code> dijamin <b>selalu pada slot yang sama</b>, sehingga perintah multi-key seperti <code>MGET</code> atau <code>WATCH</code> tetap sah.</li><li><b>Pesan MOVED</b> — bila key yang dituju ternyata dimiliki node lain (misal setelah slot berpindah), node menjawab <code>MOVED &lt;slot&gt; &lt;alamat_baru&gt;</code>, dan klien mengingat alamat itu untuk permintaan berikutnya.</li><li><b>Pesan ASK</b> — berlaku selama migrasi slot sedang berlangsung: klien diminta menanyakan dulu ke node tujuan sebelum mengirim ulang. Bersifat sementara, berbeda dengan MOVED yang menandakan perpindahan selesai.</li></ul><p>Topologi umum produksi adalah <b>3 master + 3 replica</b>: cukup ringan untuk dijalankan, tetapi tetap mampu bertahan bila satu master beserta replica-nya mengalami masalah. Perintah pembuatannya tersedia di bawah.</p>'
    },
    {
      type: 'example',
      title: 'Membuat Cluster dan Mengujinya',
      lang: 'bash',
      output: false,
      code: `# 1) Enam instance Redis dengan cluster mode aktif (ringkas)
for p in 7000 7001 7002 7003 7004 7005; do
  podman run -d --name redis-$p -p 127.0.0.1:$p:$p \\
    docker.io/library/redis:7-alpine \\
    redis-server --port $p --cluster-enabled yes \\
      --cluster-config-file nodes-$p.conf \\
      --appendonly yes --dir /data
done

# 2) Bentuk cluster: 3 master, tiap master 1 replica (jawab otomatis "yes")
redis-cli --cluster create \\
  127.0.0.1:7000 127.0.0.1:7001 127.0.0.1:7002 \\
  127.0.0.1:7003 127.0.0.1:7004 127.0.0.1:7005 \\
  --cluster-replicas 1 --cluster-yes

# 3) Periksa sebaran slot di tiap master
redis-cli -p 7000 CLUSTER SLOTS
redis-cli -p 7000 CLUSTER NODES

# 4) Uji hash tag: kedua key ini HARUS jatuh pada slot yang sama
redis-cli -p 7000 SET "{user:42}:profile" "Dewi"
redis-cli -p 7000 SET "{user:42}:cart"   "SKU-771,SKU-118"
redis-cli -p 7000 CLUSTER KEYSLOT "{user:42}:profile"
redis-cli -p 7000 CLUSTER KEYSLOT "{user:42}:cart"

# 5) Sehat atau tidak
redis-cli -p 7000 CLUSTER INFO
redis-cli --cluster check 127.0.0.1:7000`,
      explain: [
        'Opsi <code>--cluster-replicas 1</code> menempatkan satu replica di belakang tiap master; kueri <code>CLUSTER SLOTS</code> memperlihatkan rentang slot yang dimiliki masing-masing master beserta replica-nya.',
        '<code>CLUSTER KEYSLOT</code> menampilkan hasil CRC16 yang sama dengan yang dihitung klien — cara paling cepat memverifikasi bahwa hash tag bekerja sebagaimana diharapkan.',
        'Saat menulis tanpa hash tag pada cluster, perintah multi-key (misal <code>MSET a 1 b 2</code>) akan ditolak bila <code>a</code> dan <code>b</code> berada di slot berbeda; inilah alasan hash tag menjadi bagian dari desain kunci, bukan sekadar trik.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Perbandingan: Satu Instance vs Sentinel vs Cluster</h3><table><thead><tr><th>Aspek</th><th>Satu instance</th><th>Sentinel (master + replica)</th><th>Redis Cluster</th></tr></thead><tbody><tr><td><b>Ketersediaan</b></td><td>Satu titik kegagalan; perlu restart manual</td><td>Failover otomatis dalam hitungan detik</td><td>Failover otomatis per slot; bertahan bila satu node mati</td></tr><tr><td><b>Scaling baca</b></td><td>Tidak ada</td><td>Banyak replica, trafik baca bisa dibagi</td><td>Replica per master, baca terdistribusi</td></tr><tr><td><b>Scaling tulis</b></td><td>Terbatas satu mesin</td><td>Tetap satu master saja</td><td>Terbagi ke semua master (per slot)</td></tr><tr><td><b>Batas memori</b></td><td>Satu mesin</td><td>Satu mesin (replica hanya salinan)</td><td>Total seluruh master</td></tr><tr><td><b>Perintah multi-key</b></td><td>Bebas</td><td>Bebas</td><td>Hanya dalam satu slot (pakai hash tag)</td></tr><tr><td><b>Kompleksitas</b></td><td>Paling sederhana</td><td>Tiga proses sentinel + konfigurasi quorum</td><td>Manajemen slot, migrasi, dan penambahan node</td></tr><tr><td><b>Cocok untuk</b></td><td>Belajar, cache kecil, staging</td><td>Produksi dengan SLA menengah</td><td>Dataset besar atau tulis yang memenuhi satu mesin</td></tr></tbody></table><p>Perlu dicatat bahwa Sentinel dan Cluster <b>tidak saling menggantikan</b>. Sentinel menyelesaikan masalah <i>ketersediaan</i>, Cluster menyelesaikan masalah <i>skala</i> — dan Cluster justru tetap membutuhkan pengawas, baik berupa Sentinel (untuk penambahan node) maupun tool manajemen cluster lainnya.</p>'
    },
    {
      type: 'text',
      html: '<h3>Kapan Naik Kelas?</h3><p>Tangga keputusan yang sehat untuk tim kecil sampai menengah:</p><ul><li><b>Cukup satu instance</b> — data murni cache yang bisa dibangun ulang, lingkungan belajar, atau prototipe. Tambahkan <code>maxmemory</code> dan <code>maxmemory-policy</code> agar tetap terkendali, bukan berarti tanpa perencanaan.</li><li><b>Naik ke replica</b> — mulai ada data yang tidak boleh hilang, atau pembacaan mulai membebani master. Ini langkah termurah: satu perintah <code>REPLICAOF</code> tanpa mengubah satu baris kode klien pun.</li><li><b>Naik ke Sentinel</b> — master mati tidak boleh ditangani manusia pada jam tidur. Syarat minimum: <b>tiga node Sentinel dengan quorum 2</b> (angka ganjil untuk menghindari konflik suara) dan minimal satu replica per master dengan <code>min-replicas-to-write</code> aktif agar tulisan yang dianggap sukses sudah punya salinan.</li><li><b>Naik ke Cluster</b> — data mendekati batas memori satu mesin, tulis tidak lagi sanggup ditopang satu master, atau butuh beberapa region. Perubahan ini paling besar: seluruh klien harus mendukung cluster, dan seluruh perintah multi-key harus ditinjau ulang.</li></ul><p><b>Anti-pattern yang paling sering dijumpai</b>: langsung memasang Cluster untuk aplikasi yang padatnya di sisi baca, hanya karena "biar kelihatan siap skala". Padahal masalah baca jauh lebih murah diselesaikan dengan menambah replica di balik Sentinel. Baca dulu metriknya — bila yang penuh adalah memori atau operasi tulis, baru Cluster masuk akal.</p>'
    },
    {
      type: 'tip',
      title: 'Uji Failover, Jangan Sekadar Mengonfigurasinya',
      text: 'Konfigurasi Sentinel yang tidak pernah diuji sama sekali sama nilainya dengan tidak ada konfigurasi. Latih skenario nyata secukupnya: matikan container master, lalu amati apakah replica benar-benar naik dalam hitungan detik, apakah klien go-redis menerima alamat baru tanpa restart, dan berapa banyak tulisan yang tercatat gagal. Angka itulah yang kamu butuhkan saat menulis laporan ketersediaan.'
    },
    {
      type: 'warn',
      title: 'Replikasi Asinkron Bisa Kehilangan Data Terbaru',
      text: 'Karena master tidak menunggu replica mengonfirmasi, perintah yang baru saja dijawab <code>OK</code> bisa saja belum sampai ke replica ketika master tumbang. Failover otomatis kemudian mengangkat replica dengan data yang tertinggal beberapa milidetik hingga detik. Bila data tertentu wajib tidak boleh hilang, aktifkan <code>min-replicas-to-write</code>, pertimbangkan <code>WAIT</code> pada operasi kritis, dan ingat bahwa replikasi bukan pengganti backup ke lokasi terpisah.'
    },
    {
      type: 'vocab',
      items: [
        ['Master', 'Node yang menerima seluruh perintah tulis dan menyalin perubahannya ke replica.'],
        ['Replica', 'Salinan read-only dari master yang terus mengikuti perubahan lewat replikasi asinkron.'],
        ['Replication offset', 'Posisi penyalinan terakhir pada master dan replica; dipakai mengukur jarak dan memilih kandidat failover.'],
        ['Redis Sentinel', 'Proses pengawas yang memantau node, menjalankan failover otomatis, dan memberi tahu klien alamat master baru.'],
        ['Quorum', 'Jumlah sentinel yang harus sepakat sebuah node mati; umumnya 2 dari 3 node agar keputusan sah dan bebas konflik.'],
        ['Failover', 'Proses mengangkat replica menjadi master baru setelah master lama dinyatakan mati.'],
        ['Hash slot', 'Satu dari 16.384 bagian data pada Redis Cluster, diperoleh dari CRC16(key) mod 16384.'],
        ['Hash tag', 'Isi dalam kurung kurawal pada nama key yang dipakai sebagai satu-satunya dasar perhitungan slot.'],
        ['MOVED', 'Balasan yang menandakan key sudah berpindah slot secara permanen, disertai alamat pemilik barunya.'],
        ['ASK', 'Balasan sementara selama migrasi slot berlangsung, meminta klien bertanya dulu ke node tujuan.']
      ]
    }
  ],
  recap: [
    'Replikasi asinkron membuat salinan read-only yang cepat, tetapi menyisakan celah kehilangan data terbaru saat master mati; min-replicas-to-write memperkecilnya.',
    'Sentinel memantau kesehatan node, menjalankan failover otomatis berdasarkan quorum, dan memberi tahu klien alamat master baru melalui klien seperti FailoverOptions di go-redis.',
    'Redis Cluster membagi 16.384 slot ke beberapa master; hash tag menjamin key terkait berada pada slot yang sama, sementara pesan MOVED dan ASK mengarahkan klien.',
    'Tangga keputusan: satu instance untuk sederhana, replica untuk salinan dan baca, Sentinel untuk ketersediaan otomatis, Cluster hanya bila memori atau tulis satu mesin benar-benar habis.'
  ]
});
