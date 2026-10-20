/* ============================================================
   Pelajaran Redis — Bab 11: Memory Management & Performa
   ============================================================ */
'use strict';

window.REDIS_LESSONS = window.REDIS_LESSONS || [];

window.REDIS_LESSONS.push({
  id: 'memory-performa',
  title: 'Memory Management & Performa',
  chapter: 'Operasional',
  duration: '10–12 menit',
  intro: [
    'Pernahkah komputer kamu melambat drastis karena terlalu banyak tab browser terbuka? Redis mengalami hal yang sama, hanya saja dengan aturan main yang jauh lebih ketat: ia hidup sepenuhnya di RAM, dan begitu memori penuh, ia harus memilih — <b>menolak tulisan baru</b>, <b>mengusir sebagian key lama</b>, atau dalam kasus buruk <b>gugur sendiri</b> karena sistem operasi membunuhnya. Pilihan itu bukan kebetulan; semuanya ditentukan oleh dua pengaturan: <code>maxmemory</code> dan <code>maxmemory-policy</code>.',
    'Kebijakan pengusiran (eviction) sering disalahpahami sebagai "penghapus data yang tidak penting". Kenyataannya Redis tidak tahu mana data yang penting bagi bisnismu — ia hanya mengikuti strategi statistik seperti LRU (<i>Least Recently Used</i>) dan LFU (<i>Least Frequently Used</i>). Strategi itu sangat tepat untuk cache, tetapi berbahaya bila dipakai pada dataset campuran yang berisi data wajib tersimpan. Di sinilah pemilihan kebijakan menjadi keputusan arsitektur, bukan sekadar baris konfigurasi.',
    'Bab ini membekalimu tiga kemampuan: <b>mengukur</b> (memahami <code>INFO memory</code>, hit rate, dan ukuran tiap key), <b>mendiagnosis</b> (menemukan key raksasa, perintah lambat, dan penyebab latensi), lalu <b>memperbaiki</b> (pipeline, SCAN alih-alih KEYS, value yang tetap kecil, serta anti-pattern yang paling sering muncul di aplikasi nyata).'
  ],
  objectives: [
    'Menjelaskan peran maxmemory dan memilih kebijakan eviction sesuai karakter data',
    'Menggunakan INFO memory, MEMORY USAGE, MEMORY DOCTOR, serta hit rate untuk memantau pemakaian',
    'Menemukan key bermasalah dengan --bigkeys, --memkeys, dan menjelajah key memakai SCAN',
    'Mengurangi latensi lewat pipeline, hindari perintah O(N) besar, dan gunakan redis-benchmark'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>maxmemory: Batas dan Keputusan Saat Memori Penuh</h3><p>Secara bawaan, Redis berjalan <b>tanpa batas memori</b> — ia akan terus menampung data sampai memori host habis dan prosesnya dimatikan sistem operasi. Di produksi, itu bukan pilihan. Karena itu langkah pertama selalu menetapkan <code>maxmemory</code>, misalnya <code>maxmemory 4gb</code>.</p><p>Begitu batas tercapai, Redis mengambil keputusan berdasarkan <code>maxmemory-policy</code>. Ada dua kelompok besar hasil keputusan itu:</p><ul><li><b>Mengusir key (eviction)</b> — memilih sejumlah key sesuai strategi, menghapusnya, lalu membebaskan memorinya untuk tulisan baru. Cocok bila dataset memang berupa cache.</li><li><b>Menolak tulisan (noeviction)</b> — pembacaan tetap berjalan, tetapi setiap perintah tulis dibalas dengan galat <code>OOM command not allowed when used memory &gt; maxmemory</code>. Aplikasi yang tidak menangani galat ini akan berhenti bekerja dengan error 500.</li></ul><p>Dua detail teknis yang perlu diketahui: pengukuran memori mengikuti <i>used_memory</i> (yang dialokasikan Redis), bukan RSS proses yang selalu sedikit lebih besar. Selain itu, <b>overcommit memori</b> sering membuat Redis menggunakan lebih dari <code>maxmemory</code> karena overhead pengindeksan, struktur data, dan proses anak saat fork. Praktik yang lazim: beri jarak sekitar 20–30% di bawah kapasitas fisik.</p>'
    },
    {
      type: 'text',
      html: '<h3>Keputusan Saat Memori Mencapai Batas</h3>' + `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 330" width="760" role="img" aria-label="Alur keputusan memori Redis: pemakaian naik menuju batas maxmemory, kebijakan eviction menentukan key yang dihapus atau menolak tulisan">
        <rect x="20" y="35" width="200" height="75" rx="10" class="u-box"/>
        <text x="120" y="63" class="u-title" text-anchor="middle">Pemakaian Naik</text>
        <text x="120" y="87" class="u-lbl" text-anchor="middle">used_memory mendekati</text>
        <text x="120" y="106" class="u-lbl" text-anchor="middle">maxmemory 4gb</text>

        <line x1="224" y1="72" x2="284" y2="72" class="u-line" marker-end="url(#u-arrow)"/>

        <rect x="290" y="35" width="200" height="75" rx="10" class="u-hl"/>
        <text x="390" y="63" class="u-title" text-anchor="middle">Kebijakan Eviction</text>
        <text x="390" y="87" class="u-lbl" text-anchor="middle">maxmemory-policy</text>
        <text x="390" y="106" class="u-lbl" text-anchor="middle">allkeys-lru / lfu / dll</text>

        <line x1="494" y1="72" x2="554" y2="72" class="u-line" marker-end="url(#u-arrow)"/>

        <rect x="560" y="15" width="180" height="95" rx="10" class="u-box"/>
        <text x="650" y="42" class="u-title" text-anchor="middle">Eviction</text>
        <text x="650" y="64" class="u-lbl" text-anchor="middle">key dipilih dihapus</text>
        <text x="650" y="84" class="u-lbl" text-anchor="middle">lalu tulis diterima</text>
        <text x="650" y="102" class="u-lbl" text-anchor="middle">evicted_keys naik</text>

        <rect x="560" y="150" width="180" height="95" rx="10" class="u-hl"/>
        <text x="650" y="177" class="u-title" text-anchor="middle">noeviction</text>
        <text x="650" y="199" class="u-lbl" text-anchor="middle">tulisan ditolak</text>
        <text x="650" y="219" class="u-lbl" text-anchor="middle">galat OOM ke klien</text>
        <text x="650" y="237" class="u-lbl" text-anchor="middle">rejected_connections naik</text>

        <line x1="500" y1="60" x2="554" y2="55" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="500" y1="88" x2="554" y2="200" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="512" y="45" class="u-lbl" text-anchor="middle">cache</text>
        <text x="512" y="150" class="u-lbl" text-anchor="middle">data wajib</text>

        <rect x="20" y="270" width="500" height="45" rx="10" class="u-box"/>
        <text x="270" y="298" class="u-lbl" text-anchor="middle">pantau: INFO memory -&gt; used_memory_human -&gt; eviction &amp; fragmentation</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 11.1</b> — Alur keputusan memori: saat pemakaian mendekati batas, kebijakan eviction menentukan apakah key lama dihapus atau tulisan baru ditolak</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Tabel Lengkap Kebijakan Eviction</h3><p>Delapan kebijakan terbagi menjadi dua sumbu: <b>mana</b> kandidat key diambil (semua key, atau hanya key ber-TTL), dan <b>mana</b> yang dipilih (paling jarang dipakai, paling sering dipakai, acak, atau paling dekat kedaluwarsa).</p><table><thead><tr><th>Kebijakan</th><th>Kandidat key</th><th>Kriteria pemilihan</th><th>Cocok untuk</th></tr></thead><tbody><tr><td><b>noeviction</b></td><td>Tidak ada (menolak tulis)</td><td>—</td><td>Data wajib tersimpan, misal saldo dan sesi; galat harus ditangani aplikasi</td></tr><tr><td><b>allkeys-lru</b></td><td>Semua key</td><td>LRU: yang paling lama tidak dipakai</td><td>Cache umum, pilihan paling sering untuk cache murni</td></tr><tr><td><b>allkeys-lfu</b></td><td>Semua key</td><td>LFU: yang paling jarang diakses</td><td>Cache dengan pola panas-jelas, misal artikel atau produk populer</td></tr><tr><td><b>allkeys-random</b></td><td>Semua key</td><td>Acak</td><td>Saat semua data sama-sama penting dan tidak ada pola akses</td></tr><tr><td><b>volatile-lru</b></td><td>Hanya key ber-TTL</td><td>LRU</td><td>Campuran: key tanpa TTL dianggap abadi dan tidak pernah diusir</td></tr><tr><td><b>volatile-lfu</b></td><td>Hanya key ber-TTL</td><td>LFU</td><td>Sama seperti di atas, tetapi berdasarkan frekuensi akses</td></tr><tr><td><b>volatile-random</b></td><td>Hanya key ber-TTL</td><td>Acak</td><td>Cache yang seluruh key ber-TTL tanpa pola akses</td></tr><tr><td><b>volatile-ttl</b></td><td>Hanya key ber-TTL</td><td>Sisa umur paling dekat kedaluwarsa</td><td>Key yang memang punya masa berlaku jelas, buang yang hampir habis</td></tr></tbody></table><p><b>Panduan memilih secara praktis:</b> dataset murni cache → <code>allkeys-lru</code>, atau <code>allkeys-lfu</code> bila pola populer sangat timpang. Dataset campuran (cache + sesi + counter wajib) → gunakan <code>volatile-lru</code> dan pastikan hanya key cache yang diberi TTL; bila strukturnya tidak bisa dipisahkan dengan rapi, <code>noeviction</code> dengan <code>maxmemory</code> yang lebih besar adalah pilihan paling aman. LRU dan LFU di Redis bersifat <b>perkiraan</b> (sampling sekitar 100 key terpilih), bukan perhitungan sempurna — ini disengaja agar hemat CPU.</p>'
    },
    {
      type: 'text',
      html: '<h3>Memantau: Apa yang Harus Dilihat Tiap Pagi</h3><p>Empat perintah inti untuk membaca kondisi memori:</p><ul><li><b><code>INFO memory</code></b> — sumber utama. Kolom penting: <code>used_memory_human</code> (aktual dialokasikan), <code>used_memory_peak_human</code> (puncak tertinggi), <code>used_memory_rss_human</code> (memori menurut OS), <code>mem_fragmentation_bytes</code>/<code>ratio</code> (perbedaan keduanya; di atas 1.5 berarti memori terfragmentasi), <code>maxmemory_human</code>, serta <code>evicted_keys</code> dan <code>expired_keys</code>.</li><li><b><code>MEMORY USAGE key</code></b> — perkiraan ukuran satu key lengkap dengan strukturnya, sangat berguna menemukan kandidat penyebab memori meledak.</li><li><b><code>MEMORY STATS</code></b> — rincian ke mana memori terpakai: data, overhead per key, overhead klien, dan sisa.</li><li><b><code>MEMORY DOCTOR</code></b> — saran otomatis dari Redis tentang kemungkinan masalah (memori terbuang, key besar, atau klien yang tidak menutup koneksi).</li></ul><p>Petunjuk membaca <b>hit rate</b> juga sama pentingnya: <code>INFO stats</code> memuat <code>keyspace_hits</code> dan <code>keyspace_misses</code>. Rumusnya <code>hits / (hits + misses)</code>. Hit rate rendah bukan berarti Redis lambat, melainkan <b>cache kamu tidak efektif</b>: key yang dicari tidak pernah ada, TTL terlalu pendek, atau pola aksesnya terlalu acak. Perbandingan kasar: di atas 90% biasanya sehat, di bawah 70% layak diselidiki.</p>'
    },
    {
      type: 'example',
      title: 'Memeriksa Kondisi Memori dari redis-cli',
      lang: 'bash',
      output: false,
      code: `# 1) Ringkasan memori: yang dipakai, puncak, batas, dan fragmentasi
redis-cli INFO memory | grep -E "used_memory_human|used_memory_peak|maxmemory|mem_fragmentation|evicted_keys"

# 2) Berapa besar satu key yang dicurigai?
redis-cli MEMORY USAGE "cache:product:8821"
redis-cli MEMORY USAGE "sess:s_9f3a71"

# 3) Rincian ke mana memori terpakai
redis-cli MEMORY STATS

# 4) Diagnosis otomatis dari Redis
redis-cli MEMORY DOCTOR`,
      explain: [
        'Selisih besar antara <code>used_memory_rss</code> dan <code>used_memory</code> menandakan fragmentasi: memori sudah dipesan proses tetapi belum dipakai efektif, biasanya akibat value besar yang sering dihapus dan ditulis ulang.',
        '<code>MEMORY USAGE</code> menerima opsi <code>SAMPLES</code> untuk sampling yang lebih teliti pada struktur besar seperti list atau set, misalnya <code>MEMORY USAGE mylist SAMPLES 0</code> yang menelusuri seluruh elemen.',
        'Nilai <code>evicted_keys</code> yang naik terus berarti kebijakan eviction bekerja terlalu agresif terhadap dataset kamu — tanda bahwa <code>maxmemory</code> terlalu kecil atau pola key perlu ditinjau.'
      ]
    },
    {
      type: 'example',
      title: 'Menemukan Key Bermasalah dan Menjelajah dengan Aman',
      lang: 'bash',
      output: false,
      code: `# 1) Cari key terbesar per tipe (scan menyeluruh, jangan dijam sibuk)
redis-cli --bigkeys

# 2) Laporan pemakaian memori terbesar, cocok untuk menemukan cache bocor
redis-cli --memkeys

# 3) Menjelajah key: SELALU pakai SCAN, bukan KEYS *
redis-cli SCAN 0 MATCH "cache:product:*" COUNT 500
# catat cursor dari baris pertama, lalu ulangi:
redis-cli SCAN 4398046511104 MATCH "cache:product:*" COUNT 500

# 4) Telusuri berdasarkan tipe data
redis-cli --scan --pattern "sess:*" --type zset

# 5) Perintah yang berjalan lambat
redis-cli SLOWLOG GET 10
redis-cli SLOWLOG LEN
redis-cli SLOWLOG RESET`,
      explain: [
        '<code>--bigkeys</code> bekerja dengan sampling dan melaporkan key terbesar per tipe struktur (string, list, set, zset, hash) beserta saran perbaikannya.',
        '<code>KEYS *</code> berjalan <b>O(N)</b> pada seluruh key dan <b>memblokir</b> server selama eksekusi; <code>SCAN</code> mengulang secara bertahap dengan cursor sehingga permintaan lain tetap terlayani, meski hasilnya tidak dijamin urut.',
        '<code>SLOWLOG</code> merekam perintah yang melampaui <code>slowlog-log-slower-than</code> (bawaan 10.000 mikrodetik) — biasanya perintah <code>LRANGE</code>, <code>HGETALL</code>, atau <code>KEYS</code> pada struktur besar.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Mengurangi Latensi: Pipeline dan Perintah Ringan</h3><p>Bila latensi p99 melonjak padahal Redis sendiri sehat, hampir selalu salah satu dari tiga hal ini:</p><ul><li><b>Banyak round-trip kecil</b> — 100 <code>GET</code> terpisah berarti 100 perjalanan jaringan. Dengan <b>pipeline</b>, seluruh perintah dikirim dalam satu paket lalu hasilnya dibaca bersama; latensi jaringan hanya dibayar sekali. Ini obat utama untuk pola <b>N+1 kecil-kecil</b> yang sering muncul dari ORM atau loop di aplikasi.</li><li><b>Perintah O(N) pada struktur besar</b> — <code>HGETALL</code> pada hash berisi jutaan field, <code>LRANGE 0 -1</code> pada list panjang, <code>SMEMBERS</code> pada set raksasa. Ganti dengan varian bertahap: <code>HSCAN</code>, <code>SSCAN</code>, <code>ZSCAN</code>, atau batasi rentangnya.</li><li><b>Value terlalu besar</b> — satu string 2 MB membebani memori, jaringan, dan memperlambat transfer. Simpan hanya yang dibutuhkan; detail besar sebaiknya tetap hidup di database objek atau kolom teks.</li></ul><p>Untuk membuktikan hasil perubahan, pakai <code>redis-benchmark</code> yang bawaan image Redis. Pada pengukuran singkat, opsi <code>-c</code> menentukan jumlah koneksi bersamaan dan <code>-Q</code> menjalankan pengujian berdasarkan kuota operasi per detik (berguna menguji apakah server sanggup menopang target trafikmu).</p><p>Satu catatan jujur: benchmark tanpa data nyata sering menyesatkan. Ukur pula <b>hit rate</b> dan <i>slow query log</i> pada kondisi produksi, karena dua hal itulah yang paling sering menjadi akar keluhan "Redis lambat".</p>'
    },
    {
      type: 'example',
      title: 'Pipeline Massal dan Pengukuran Benchmark',
      lang: 'go',
      output: false,
      code: `package cache

import (
	"context"
	"fmt"
	"strings"

	"github.com/redis/go-redis/v9"
)

func BulkGet(ctx context.Context, rdb *redis.Client, ids []string) (map[string]string, error) {
	pipe := rdb.Pipeline()
	cmds := make([]*redis.StringCmd, len(ids))
	for i, id := range ids {
		cmds[i] = pipe.Get(ctx, "cache:product:"+id)
	}
	// satu perjalanan jaringan untuk seluruh kunci, bukan satu per kunci
	if _, err := pipe.Exec(ctx); err != nil && err != redis.Nil {
		return nil, err
	}
	out := make(map[string]string, len(ids))
	for i, cmd := range cmds {
		if cmd.Val() != "" {
			out[ids[i]] = cmd.Val()
		}
	}
	return out, nil
}

func HitRate(ctx context.Context, rdb *redis.Client) (float64, error) {
	info, err := rdb.Info(ctx, "stats").Result()
	if err != nil {
		return 0, err
	}
	var hits, misses int64
	for _, line := range strings.Split(info, "\n") {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "keyspace_hits:") {
			fmt.Sscanf(line, "keyspace_hits:%d", &hits)
		}
		if strings.HasPrefix(line, "keyspace_misses:") {
			fmt.Sscanf(line, "keyspace_misses:%d", &misses)
		}
	}
	total := hits + misses
	if total == 0 {
		return 0, nil
	}
	return float64(hits) / float64(total) * 100, nil
}

func BenchmarkNote() {
	fmt.Println("redis-benchmark -h 127.0.0.1 -p 6379 -c 50 -n 100000 -t set,get")
	fmt.Println("redis-benchmark -h 127.0.0.1 -q -n 100000 -c 50 set, get")
}`,
      explain: [
        'Satu pemanggilan <code>pipe.Exec</code> mengirim seluruh perintah sekaligus; untuk 500 key, ini mengubah 500 latensi jaringan menjadi satu — perbaikan paling nyata pada pola N+1.',
        'Perhitungan hit rate dibaca langsung dari <code>INFO stats</code> dan dipasok ke pemantauan; penurunan tajam biasanya menandakan perubahan pola key atau TTL yang terlalu pendek.',
        'Perintah <code>redis-benchmark</code> di baris akhir memakai <code>-q</code> agar keluarannya ringkas (hanya operasi per detik), cocok untuk pengukuran cepat sebelum dan sesudah perubahan.'
      ]
    },
    {
      type: 'example',
      title: 'Mengukur Hit Rate dan Benchmark Singkat',
      lang: 'bash',
      output: false,
      code: `# Ambil dua angka hit rate
redis-cli INFO stats | grep -E "keyspace_hits|keyspace_misses"

# Contoh perhitungan manual:
#   hits = 918344   misses = 76120
#   hit rate = 918344 / (918344 + 76120) = 92,3 %

# Benchmark tulis dan baca: 50 koneksi, 100.000 operasi
redis-benchmark -h 127.0.0.1 -p 6379 -c 50 -n 100000 -t set,get

# Uji dengan ukuran value lebih besar untuk melihat pengaruhnya
redis-benchmark -h 127.0.0.1 -p 6379 -c 50 -n 20000 -d 1024 -t set

# Mode kuota: berapa operasi per detik yang sanggup dilayani
redis-benchmark -h 127.0.0.1 -p 6379 -q -n 100000 -c 50 get`,
      explain: [
        'Selalu catat dua kondisi saat membandingkan hasil benchmark: ukuran value (<code>-d</code>) dan jumlah koneksi (<code>-c</code>); angka tanpa konteks ini mudah menyesatkan.',
        'Hit rate yang stabil di kisaran 90% ke atas menunjukkan sebagian besar permintaan terlayani dari memori; bila tiba-tiba anjlok, periksa apakah TTL berubah atau ada pembersihan massal key.',
        'Pengujian <code>-t set</code> dengan value 1 KB memberi gambaran lebih jujur daripada value bawaan beberapa byte, karena di produksi value nyata tidak pernah sekecil itu.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Anti-Pattern Memori yang Paling Sering Ditemui</h3><table><thead><tr><th>Anti-pattern</th><th>Gejala</th><th>Perbaikan</th></tr></thead><tbody><tr><td><b>Key tanpa TTL menumpuk</b></td><td><code>used_memory</code> naik terus meski trafik stabil; <code>DBSIZE</code> terus bertambah</td><td>Wajibkan TTL pada key cache lewat default aplikasi, bersihkan key lama dengan <code>SCAN</code> + <code>DEL</code> terjadwal</td></tr><tr><td><b>Value raksasa</b></td><td>Latensi membaca naik, RSS jauh melebihi batas yang ditetapkan</td><td>Simpan hanya data yang dipakai; pecah menjadi beberapa key atau pindahkan blob ke objek storage</td></tr><tr><td><b>N+1 kecil-kecil tanpa pipeline</b></td><td>Jumlah pemanggilan tinggi, latensi p99 melonjak walau beban CPU rendah</td><td>Kumpulkan perintah dalam satu pipeline atau <code>MGET</code>, kurangi round-trip jaringan</td></tr><tr><td><b>KEYS * di produksi</b></td><td>Server berhenti merespons selama pemindaian</td><td>Ganti dengan <code>SCAN</code> bertahap atau <code>--scan</code> pada alat baris perintah</td></tr><tr><td><b>Satu hash berisi jutaan field</b></td><td><code>HGETALL</code> memblokir, memori sulit dibatasi per entri</td><td>Pecah per shard (misal per kategori) dan baca dengan <code>HSCAN</code></td></tr></tbody></table><p>Pola ketiga layak diperhatikan lebih dalam: bayangkan aplikasi memuat 50 produk, lalu untuk tiap produk melakukan satu <code>HGETALL</code> ke Redis. Total 50 perjalanan jaringan hanya untuk data yang bisa diambil dalam sekali kirim. Dengan pipeline, jumlah itu menyusut menjadi satu round-trip — dan latensi turun dari puluhan milidetik menjadi serat milidetik tanpa mengubah satu baris logika bisnis pun.</p>'
    },
    {
      type: 'tip',
      title: 'Tetapkan maxmemory Sejak Hari Pertama di Produksi',
      text: 'Menetapkan <code>maxmemory</code> dan <code>maxmemory-policy</code> jauh sebelum memori penuh jauh lebih baik daripada memperbaikinya setelah insiden. Dengan batas yang jelas, Redis memilih perilaku yang sudah kamu tentukan (mengusir atau menolak), bukan sistem operasi yang memutuskan proses mana yang dibunuh di saat paling kritis.'
    },
    {
      type: 'warn',
      title: 'KEYS * Bisa Menghentikan Sementara Seluruh Aplikasi',
      text: 'Perintah <code>KEYS *</code> memindai seluruh key secara tunggal dan <b>memblokir</b> Redis selama eksekusi. Pada instance berisi jutaan key, blokasan ini berlangsung ratusan milidetik hingga lebih — cukup untuk membuat antrean permintaan menumpuk dan seluruh aplikasi tampak <i>down</i>. Gunakan <code>SCAN</code> dengan <code>COUNT</code> yang wajar, jalankan pada jam sepi, dan batasi pola dengan <code>MATCH</code>.'
    },
    {
      type: 'vocab',
      items: [
        ['maxmemory', 'Batas memori yang diperbolehkan dipakai Redis; tanpanya ia mengisi RAM sampai proses dibunuh sistem operasi.'],
        ['Eviction', 'Proses menghapus key untuk membebaskan memori saat batas maxmemory tercapai.'],
        ['LRU (Least Recently Used)', 'Strategi mengusir key yang paling lama tidak diakses; di Redis dihitung dengan sampling.'],
        ['LFU (Least Frequently Used)', 'Strategi mengusir key yang paling jarang diakses, cocok untuk beban akses yang timpang.'],
        ['noeviction', 'Kebijakan yang menolak seluruh perintah tulis saat memori penuh, tetapi tetap melayani pembacaan.'],
        ['Fragmentasi', 'Selisih antara memori yang dialokasikan Redis dengan yang terlihat oleh sistem operasi akibat alokasi berulang.'],
        ['SCAN', 'Perintah menjelajah key secara bertahap dengan cursor sehingga tidak memblokir server seperti KEYS.'],
        ['Pipeline', 'Pengiriman banyak perintah Redis dalam satu putaran jaringan untuk menekan latensi.'],
        ['SLOWLOG', 'Log perintah yang melebihi ambang waktu tertentu, dipakai menemukan perintah lambat.'],
        ['Hit rate', 'Rasio pembacaan yang berhasil menemukan key terhadap seluruh pembacaan: hits / (hits + misses).']
      ]
    }
  ],
  recap: [
    'maxmemory menentukan batas pemakaian dan maxmemory-policy menentukan tindakannya: mengusir key sesuai strategi (eviction) atau menolak tulisan (noeviction).',
    'Cache murni cocok memakai allkeys-lru atau allkeys-lfu; dataset campuran dengan data wajib sebaiknya memakai volatile-lru dengan TTL hanya pada key cache, atau noeviction bila tidak bisa dipisahkan.',
    'Pantau lewat INFO memory, MEMORY USAGE per key, MEMORY STATS, MEMORY DOCTOR, serta hit rate dari keyspace_hits dan keyspace_misses.',
    'Tekan latensi dengan pipeline untuk pola N+1, ganti KEYS dengan SCAN, hindari perintah O(N) pada struktur besar, jaga value tetap kecil, dan validasi dengan redis-benchmark.'
  ]
});
