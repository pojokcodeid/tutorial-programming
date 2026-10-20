/* ============================================================
   Pelajaran Redis — Bab 7: Transaksi & Operasi Atomik
   ============================================================ */
'use strict';

window.REDIS_LESSONS = window.REDIS_LESSONS || [];

window.REDIS_LESSONS.push({
  id: 'transaksi-atomik',
  title: 'Transaksi & Operasi Atomik',
  chapter: 'Integrasi Go',
  duration: '10–12 menit',
  intro: [
    'Dua teller melayani satu rekening yang saldonya 100 ribu. Teller pertama membaca saldo, mengurangi 30 ribu; di detik yang sama teller kedua membaca saldo yang masih terlihat 100 ribu dan mengurangi 50 ribu. Setelah keduanya selesai, saldo menjadi 70 ribu padahal seharusnya 50 ribu — uang 30 ribu seolah menguap. Bukan perhitungannya yang salah, melainkan <b>dua langkah kecil yang terjadi bersamaan tanpa satu kesatuan</b>.',
    'Redis melayani miliaran perintah per detik, sehingga jendela bersamaan seperti itu nyata adanya. Solusinya hadir dalam tiga tingkat: <b>MULTI/EXEC</b> untuk mengantrekan beberapa perintah agar dieksekusi bersamaan, <b>WATCH</b> untuk mendeteksi apakah kunci berubah selama persiapan (optimistic locking), dan <b>Lua scripting</b> untuk menaruh keputusan — membaca, membandingkan, lalu menulis — tepat di dalam server sehingga tidak ada celah sama sekali.',
    'Bab ini mengajakmu melihat ketiganya dari sisi admin lewat redis-cli, lalu menerjemahkannya ke go-redis: <code>TxPipeliner</code> untuk transaksi dan <code>rdb.Watch</code> dengan fungsi callback untuk optimistic locking. Di tengah ada tabel perbandingan pipeline, transaksi, dan Lua sebagai peta keputusan, serta studi kasus transfer antar saldo. Ditutup dengan kehati-hatian atas skrip yang memblokir dan daftar anti-pattern paling sering muncul.'
  ],
  objectives: [
    'Menjalankan MULTI, EXEC, dan DISCARD di redis-cli beserta urutan balasannya',
    'Menerapkan WATCH untuk optimistic locking beserta logika mengulang saat EXEC gagal',
    'Menggunakan TxPipeliner dan rdb.Watch di go-redis dengan jumlah percobaan terbatas',
    'Memilih antara pipeline, transaksi, dan Lua scripting sesuai kebutuhan operasi'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Mengapa Operasi Atomik Dibutuhkan</h3><p><b>Atomik</b> berarti berlangsung utuh: seluruh perintah dijalankan atau tidak satupun. Tanpa kesatuan seperti ini, aplikasi menyimpan data dalam kondisi setengah jadi yang terlihat oleh pembaca lain — saldo sudah berkurang tetapi penerima belum bertambah, stok sudah dipotong tetapi pesanan belum tercatat.</p><p>Redis pada dasarnya mengeksekusi perintah satu per satu secara serial (satu proses utama yang melayani klien), sehingga satu perintah individual sudah atomik. Masalahnya muncul ketika sebuah pekerjaan logis terdiri atas <b>beberapa perintah</b>: baca saldo, periksa syarat, tulis dua kunci. Di antara perintah-perintah itu, klien lain bisa masuk dan mengubah keadaan.</p><p>Tiga alat disediakan Redis untuk menutup celah itu, masing-masing dengan filosofi berbeda: mengantre, memantau, atau memindahkan keputusan ke dalam server.</p>'
    },
    {
      type: 'text',
      html: '<h3>MULTI, EXEC, dan DISCARD</h3><p>Perintah <code>MULTI</code> membuka blok transaksi. Setiap perintah sesudahnya <b>bukan langsung dieksekusi</b>, melainkan diantrikan server dan dibalas <code>QUEUED</code>. <code>EXEC</code> lalu menjalankan seluruh antrean itu dalam satu giliran, dan <code>DISCARD</code> membuang antrean bila kamu berubah pikiran.</p><ul><li><b>Urutan balasan penting</b>: <code>OK</code> ketika MULTI dibuka, <code>QUEUED</code> untuk tiap perintah, lalu daftar hasil ketika EXEC dijalankan.</li><li><b>Galat di tengah antrean</b>: bila satu perintah tidak valid (misalnya memanggil GET pada tipe data yang salah), Redis menandainya saat antrian; EXEC kemudian menolak seluruh blok.</li><li><b>Tanpa rollback parsial</b>: kalau perintah gagal di dalam EXEC (misalnya <code>INCR</code> pada key bertipe string yang berisi huruf), perintah lain tetap jalan — Redis tidak mengenal rollback ala SQL.</li></ul><p>Singkatnya, transaksi Redis adalah <b>penggabungan eksekusi</b>, bukan jaminan isolasi dan daya tahan seperti pada database relasional.</p>'
    },
    {
      type: 'example',
      title: 'Sesi MULTI, EXEC, dan DISCARD di redis-cli',
      lang: 'redis',
      output: false,
      code: '127.0.0.1:6379> SET saldo:alice 100\nOK\n127.0.0.1:6379> SET saldo:bob 0\nOK\n\n# Buka transaksi: semua perintah berikut hanya diantrikan\n127.0.0.1:6379> MULTI\nOK\n127.0.0.1:6379> DECRBY saldo:alice 30\nQUEUED\n127.0.0.1:6379> INCRBY saldo:bob 30\nQUEUED\n127.0.0.1:6379> EXEC\n1) (integer) 70\n2) (integer) 30\n\n# Batalkan sebelum sempat dieksekusi\n127.0.0.1:6379> MULTI\nOK\n127.0.0.1:6379> SET saldo:alice 0\nQUEUED\n127.0.0.1:6379> DISCARD\nOK\n127.0.0.1:6379> GET saldo:alice\n"70"',
      explain: [
        'Perhatikan dua balasan <code>QUEUED</code>: pada titik itu belum ada satu pun data yang berubah; perubahan baru terjadi ketika <code>EXEC</code> dijalankan.',
        'Hasil <code>EXEC</code> berupa daftar balasan sesuai urutan perintah, sehingga pemanggil bisa mengecek hasil masing-masing — di go-redis daftar ini muncul pada hasil TxPipeliner.',
        'Sesi kedua dibatalkan dengan <code>DISCARD</code>; saldo tetap 70 seperti sebelumnya, membuktikan bahwa pembatalan benar-benar membuang seluruh antrean.'
      ]
    },
    {
      type: 'text',
      html: '<h3>WATCH: Optimistic Locking</h3><p>Transaksi biasa menjamin perintah berjalan bersamaan, tetapi <b>tidak</b> menjamin data yang dibaca tadi masih berlaku. Di sinilah <code>WATCH</code> bekerja: ia memantau satu atau lebih kunci, dan bila kunci itu diubah pihak lain <b>sebelum EXEC berjalan</b>, seluruh transaksi dibatalkan (EXEC membalas <code>nil</code>).</p><p>Urutan lengkapnya menjadi:</p><ol><li><code>WATCH key</code> — pasang pengawas.</li><li>Baca nilai dan putuskan apakah perubahan layak dilakukan.</li><li><code>MULTI</code>, lalu tulis perintah perubahan.</li><li><code>EXEC</code> — bila kunci tetap utuh, perintah dijalankan atomik; bila berubah, balasannya <code>nil</code> dan program <b>wajib mengulang dari langkah pertama</b> (membaca ulang, karena nilai sudah basi).</li></ol><p>Pendekatan ini disebut <b>optimistic</b> karena tidak mengunci apa pun selama menunggu — tidak ada klien lain yang diblokir. Harganya ada di sisi program: kamu menulis logika pengulangan, membatasinya, dan memberi jeda acak agar dua proses yang berebut tidak terus saling menumbangkan.</p>'
    },
    {
      type: 'text',
      html: '<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Alur optimistic locking WATCH lalu MULTI lalu EXEC dengan hasil sukses atau gagal dan percobaan ulang"><rect x="20" y="40" width="150" height="55" rx="8" class="u-box"/><text x="95" y="64" class="u-title" text-anchor="middle">WATCH key</text><text x="95" y="84" class="u-lbl" text-anchor="middle">pasang pengawas</text><line x1="170" y1="68" x2="204" y2="68" class="u-line" marker-end="url(#u-arrow)"/><rect x="210" y="40" width="140" height="55" rx="8" class="u-box"/><text x="280" y="64" class="u-title" text-anchor="middle">Baca nilai</text><text x="280" y="84" class="u-lbl" text-anchor="middle">putuskan perubahan</text><line x1="350" y1="68" x2="384" y2="68" class="u-line" marker-end="url(#u-arrow)"/><rect x="390" y="40" width="170" height="55" rx="8" class="u-box"/><text x="475" y="64" class="u-title" text-anchor="middle">MULTI + perintah</text><text x="475" y="84" class="u-lbl" text-anchor="middle">diantrekan</text><line x1="560" y1="68" x2="594" y2="68" class="u-line" marker-end="url(#u-arrow)"/><rect x="600" y="40" width="140" height="55" rx="8" class="u-hl"/><text x="670" y="64" class="u-title" text-anchor="middle">EXEC</text><text x="670" y="84" class="u-lbl" text-anchor="middle">titik keputusan</text><line x1="580" y1="95" x2="580" y2="125" class="u-line"/><line x1="580" y1="125" x2="210" y2="125" class="u-line"/><line x1="210" y1="125" x2="210" y2="172" class="u-line" marker-end="url(#u-arrow)"/><text x="395" y="118" class="u-lbl" text-anchor="middle">EXEC balas OK — perintah dijalankan atomik</text><rect x="60" y="178" width="300" height="55" rx="8" class="u-hl"/><text x="210" y="202" class="u-title" text-anchor="middle">Sukses</text><text x="210" y="222" class="u-lbl" text-anchor="middle">selesai, tidak ada yang diulang</text><line x1="670" y1="95" x2="670" y2="172" class="u-line" marker-end="url(#u-arrow)"/><text x="696" y="140" class="u-lbl" text-anchor="start">EXEC balas nil</text><rect x="520" y="178" width="220" height="55" rx="8" class="u-box"/><text x="630" y="202" class="u-title" text-anchor="middle">Gagal (kunci berubah)</text><text x="630" y="222" class="u-lbl" text-anchor="middle">nilai sudah basi</text><line x1="630" y1="233" x2="630" y2="258" class="u-line"/><line x1="630" y1="258" x2="40" y2="258" class="u-line"/><line x1="40" y1="258" x2="40" y2="102" class="u-line" marker-end="url(#u-arrow)"/><text x="330" y="278" class="u-lbl" text-anchor="middle">retry: baca ulang dari WATCH (batasi percobaan + jeda acak)</text></svg></div><figcaption class="fig-cap"><b>Gambar 7.1</b> — Optimistic locking: EXEC sukses bila kunci tetap utuh, dan program mengulang dari WATCH bila kunci berubah</figcaption></figure>'
    },
    {
      type: 'text',
      html: '<h3>Padanan di go-redis: TxPipeliner dan Watch</h3><p>Di go-redis, antrean ala MULTI/EXEC tersedia lewat <code>tx.TxPipeliner(ctx, fn)</code>: seluruh perintah di dalam fungsi <code>fn</code> dikumpulkan lalu dijalankan sebagai satu blok transaksi.</p><p>Sedangkan <code>rdb.Watch(ctx, fn, keys...)</code> adalah pembungkus rapi untuk pola WATCH: klien mengawasi daftar <code>keys</code>, menjalankan fungsi <code>fn</code> (di dalamnya kamu membaca dan menyiapkan perubahan), lalu menutup dengan EXEC. Bila kunci berubah selama fungsi berjalan, <code>fn</code> <b>dijalankan ulang secara otomatis</b> dan kamu akan menerima error <code>redis.TxFailedErr</code> bila upaya berikutnya pun tetap bentrok.</p><p>Dua kebiasaan baik yang wajib dibawa: <b>batasi jumlah percobaan</b> (misalnya tiga) dan beri <b>jeda bertambah dengan sedikit acakan</b> — dua proses yang terus-menerus saling gagal akan membuat CPU bekerja tanpa kemajuan (namanya <i>livelock</i>).</p>'
    },
    {
      type: 'example',
      title: 'Transfer antar saldo dengan WATCH dan percobaan terbatas',
      lang: 'go',
      output: false,
      code: 'package main\n\nimport (\n  "context"\n  "errors"\n  "fmt"\n  "time"\n\n  "github.com/redis/go-redis/v9"\n)\n\nfunc transfer(ctx context.Context, rdb *redis.Client, from, to string, amount int) error {\n  keys := []string{"saldo:" + from, "saldo:" + to}\n\n  var lastErr error\n  for attempt := 1; attempt <= 3; attempt++ { // percobaan DIBATASI\n    err := rdb.Watch(ctx, func(tx *redis.Tx) error {\n      a, err := tx.Get(ctx, "saldo:"+from).Int()\n      if err != nil {\n        return err\n      }\n      if a < amount {\n        return fmt.Errorf("saldo %s tidak mencukupi", from)\n      }\n\n      // MULTI: perintah dikumpulkan, lalu EXEC pada akhir callback\n      _, err = tx.TxPipeliner(ctx, func(pipe redis.Pipeliner) error {\n        pipe.DECRBY(ctx, "saldo:"+from, amount)\n        pipe.INCRBY(ctx, "saldo:"+to, amount)\n        return nil\n      })\n      return err\n    }, keys...)\n\n    if err == nil {\n      return nil // sukses\n    }\n    if errors.Is(err, redis.TxFailedErr) {\n      lastErr = err\n      time.Sleep(time.Duration(attempt*20) * time.Millisecond) // jeda + jitter\n      continue\n    }\n    return err // misalnya saldo tidak cukup: tidak perlu diulang\n  }\n  return fmt.Errorf("transfer gagal setelah 3 percobaan: %w", lastErr)\n}',
      explain: [
        'Kunci yang dipantau diberikan sebagai <code>keys...</code> terakhir; go-redis otomatis memanggil WATCH sebelum callback dan EXEC di akhir callback.',
        'Di dalam callback, <code>tx.Get</code> membaca saldo lebih dulu — hasil baca inilah yang menjadi dasar keputusan, dan nilai itulah yang dijamin masih berlaku ketika EXEC berjalan.',
        '<code>redis.TxFailedErr</code> berarti kunci berubah selama persiapan; kode mengulang dengan jeda bertambah. Percobaan dibatasi tiga kali supaya tidak berputar tanpa batas.',
        'Kondisi "saldo tidak cukup" mengembalikan error biasa dan langsung berhenti — mengulanginya hanya akan menghasilkan keputusan yang sama.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Pipeline, Transaksi, atau Lua?</h3><p>Ketiganya mengirim banyak perintah, tetapi menjawab kebutuhan yang berbeda. Tabel berikut menjadi peta keputusan singkat sebelum kamu menulis kode:</p><table><thead><tr><th></th><th>Pipeline</th><th>MULTI/EXEC + WATCH</th><th>Lua (EVAL)</th></tr></thead><tbody><tr><td><b>Sifat</b></td><td>Mengumpulkan perintah lalu mengirimnya sekaligus</td><td>Perintah diantrekan dan dijalankan atomik dengan deteksi konflik</td><td>Satu skrip berjalan penuh di dalam server</td></tr><tr><td><b>Baca lalu memutuskan</b></td><td>Tidak bisa</td><td>Bisa, tetapi keputusannya di sisi klien setelah WATCH</td><td>Bisa penuh: baca, bandingkan, tulis dalam satu langkah</td></tr><tr><td><b>Kegagalan</b></td><td>Sebagian perintah bisa gagal di tengah</td><td>EXEC membalas nil, program harus mengulang</td><td>Skrip berhenti tanpa meninggalkan tulisan separuh</td></tr><tr><td><b>Risiko utama</b></td><td>Batch terlalu besar menghabiskan memori dan memperlambat respon</td><td>Percobaan ulang menumpuk bila kunci sangat ramai</td><td>Skrip lambat memblokir seluruh server</td></tr><tr><td><b>Cocok untuk</b></td><td>Membaca atau menulis puluhan key sekali jalan</td><td>Dua atau tiga kunci yang wajib berubah bersama</td><td>Aturan bisnis yang harus dievaluasi di sisi Redis</td></tr></tbody></table><p>Aturan praktisnya: mulai dari yang paling ringan — <b>pipeline</b> bila hanya butuh kecepatan pengiriman, <b>transaksi</b> bila ada kunci yang dipantau, dan <b>Lua</b> bila keputusannya harus berada di titik yang sama dengan data, tanpa jeda sama sekali.</p>'
    },
    {
      type: 'text',
      html: '<h3>Lua Scripting: Keputusan di Dalam Server</h3><p><code>EVAL</code> menjalankan skrip Lua di dalam proses Redis, sehingga tidak ada klien lain yang bisa masuk di antara pembacaan dan penulisan. Seluruh isi skrip berjalan atomik. Dua aturan penamaan wajib diketahui: daftar kunci selalu diberikan lewat <b><code>KEYS[]</code></b> (dan harus lengkap), sementara argumen bebas lewat <b><code>ARGV[]</code></b> — nomor <code>numkeys</code> di tengah menentukan batas antara keduanya.</p><p>Untuk penggunaan berulang, jangan mengirim ulang teks skrip setiap kali. <code>SCRIPT LOAD</code> mengembalikan <b>SHA-1</b> 40 karakter dari isi skrip; sejak itu cukup <code>EVALSHA &lt;sha&gt; &lt;numkeys&gt; ...</code> yang jauh lebih ringan. Bila SHA sudah kedaluwarsa (server baru saja me-*flush script*), kembalikan ke <code>EVAL</code> sekali dan simpan SHA baru.</p><p>Dua kehati-hatian yang tidak boleh dilupakan: (1) Redis menjalankan skrip pada satu proses utama, jadi skrip panjang dengan <b>perulangan besar</b> atau ribuan <code>redis.call</code> akan menahan seluruh klien lain; (2) gunakan <code>redis.call</code> seperlunya dan batasi jumlah key, agar skrip tetap dalam hitungan mikrodetik.</p>'
    },
    {
      type: 'example',
      title: 'EVAL: transfer atomik dan pelepasan kunci dengan verifikasi token',
      lang: 'redis',
      output: false,
      code: '# 1) Transfer: cek saldo lalu pindahkan dana dalam satu langkah atomik\n> EVAL "local a = tonumber(redis.call(\'GET\', KEYS[1]) or \'0\')\n if tonumber(ARGV[1]) > a then return 0 end\n redis.call(\'DECRBY\', KEYS[1], ARGV[1])\n redis.call(\'INCRBY\', KEYS[2], ARGV[1])\n return 1" 2 saldo:alice saldo:bob 30\n(integer) 1\n\n# 2) Unlock yang aman: hapus hanya bila kunci masih milik kita\n> EVAL "if redis.call(\'GET\', KEYS[1]) == ARGV[1] then return redis.call(\'DEL\', KEYS[1]) else return 0 end" 1 lock:laporan token-abc-77\n(integer) 1\n\n# 3) Kunci sudah diambil orang lain: tidak ada yang dihapus\n> EVAL "if redis.call(\'GET\', KEYS[1]) == ARGV[1] then return redis.call(\'DEL\', KEYS[1]) else return 0 end" 1 lock:laporan token-bedaaa\n(integer) 0',
      explain: [
        'Argumen pertama <code>2</code> berarti dua kunci: <code>KEYS[1]</code> = saldo:alice, <code>KEYS[2]</code> = saldo:bob; sisanya adalah <code>ARGV[1]</code> berupa jumlah transfer.',
        'Karena pembacaan dan penulisan berada di dalam satu skrip, tidak ada klien yang sempat mengubah saldo di antaranya — celah yang bisa terjadi pada pola baca-lalu-tulis di sisi aplikasi.',
        'Skrip kedua mencegah pelepasan kunci sembarangan: hanya pemegang token yang benar boleh menghapus lock, sehingga lock milik proses lain tidak ikut terbawa.',
        'Balasan <code>0</code> pada percobaan ketiga menunjukkan token tidak cocok — pemanggil tahu bahwa ia sudah kehilangan kunci dan harus berhenti, bukan mengulang paksa.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Anti-Pattern Transaksi dan Skrip</h3><ul><li><b>Loop WATCH tanpa batas.</b> Mencoba ulang selamanya ketika kunci sangat ramai membuat dua proses saling menumbangkan tanpa hasil (livelock) dan membakar CPU percuma. Selalu beri batas percobaan, jeda bertambah, lalu putuskan: gagal total atau dikerjakan ulang oleh proses lain.</li><li><b>Memasukkan banyak perintah berat ke dalam satu transaksi.</b> <code>HGETALL</code> pada hash ratusan ribu field atau kueri penjelajahan di dalam blok MULTI memperpanjang giliran yang dipegang server, menunda klien lain. Transaksi yang baik berisi sedikit perintah kecil yang benar-benar harus bersamaan.</li><li><b>Lupa bahwa transaksi Redis tidak melakukan rollback.</b> Perintah yang gagal di dalam EXEC tidak mengembalikan perintah sebelumnya; jangan mengandalkan semantik ala SQL yang memang tidak ada.</li><li><b>Mengirim ulang seluruh teks skrip di setiap panggilan.</b> Untuk skrip yang dipakai berulang, <code>SCRIPT LOAD</code> dan <code>EVALSHA</code> menghemat bandwidth dan waktu parsing; kembalikan ke <code>EVAL</code> hanya ketika SHA tidak dikenal.</li><li><b>WATCH pada kunci yang sangat ramai.</b> Semakin sering kunci berubah, semakin sering EXEC gagal. Untuk kasus demikian pertimbangkan memindahkan keputusan ke Lua agar hanya ada satu percobaan.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Mulai dari Alat Paling Ringan',
      text: 'Urutan keputusan yang praktis: kalau cuma ingin menghemat perjalanan jaringan, pakai <b>pipeline</b>; kalau ada dua sampai tiga kunci yang wajib berubah bersama, pakai <b>MULTI/EXEC dengan WATCH</b>; kalau keputusannya melibatkan pembacaan dan penulisan yang tidak boleh terpisah sama sekali, pakai <b>Lua</b>. Terakhir ini paling ampuh, tetapi juga paling menuntut disiplin — mulailah dari skrip pendek dan ukur waktunya dengan <code>redis-cli --latency</code> sebelum dipakai lebar.'
    },
    {
      type: 'warn',
      title: 'Satu Proses Utama, Satu Kesempatan',
      text: 'Redis melayani klien lewat satu proses utama; baik skrip Lua maupun perintah berat berjalan tanpa terputus di hadapan klien lain. Skrip dengan perulangan panjang, <code>HGETALL</code> raksasa, atau pemrosesan ribuan key dalam satu kali panggilan akan <b>membekukan seluruh instance</b> selama itu berlangsung. Batasi jumlah key, pecah pekerjaan besar menjadi langkah kecil, dan pastikan skrip selesai dalam hitungan mikrodetik.'
    },
    {
      type: 'vocab',
      items: [
        ['MULTI', 'Perintah yang membuka blok transaksi; perintah sesudahnya diantrikan server, bukan langsung dieksekusi.'],
        ['EXEC', 'Perintah yang menjalankan seluruh antrean dalam satu giliran; membalas nil bila kunci yang di-WATCH berubah.'],
        ['DISCARD', 'Perintah untuk membuang antrean transaksi yang belum dieksekusi.'],
        ['WATCH', 'Pengawas kunci: bila kunci diubah pihak lain sebelum EXEC, seluruh transaksi dibatalkan.'],
        ['Optimistic locking', 'Strategi tanpa mengunci kunci saat menunggu; konflik justru terdeteksi ketika EXEC dijalankan dan ditangani dengan mengulang.'],
        ['redis.TxFailedErr', 'Error go-redis yang menandakan EXEC gagal karena kunci berubah; satu-satunya tanda bahwa transaksi perlu diulang.'],
        ['TxPipeliner', 'Fungsi go-redis yang mengumpulkan perintah lalu menjalankannya sebagai blok MULTI/EXEC.'],
        ['KEYS[] dan ARGV[]', 'Dua larik baku skrip Redis: daftar kunci (wajib lengkap) dan argumen bebas, dipisahkan oleh parameter numkeys.'],
        ['EVALSHA', 'Menjalankan skrip berdasarkan SHA-1 hasil SCRIPT LOAD, sehingga teks skrip tidak perlu dikirim ulang.']
      ]
    }
  ],
  recap: [
    'MULTI mengantrekan perintah, EXEC mengeksekusinya atomik, dan DISCARD membuang antrean; transaksi Redis menyatukan eksekusi, bukan menyediakan rollback ala SQL.',
    'WATCH memberi optimistic locking: bila kunci berubah sebelum EXEC, balasannya nil dan program wajib membaca ulang serta mengulang dengan batas percobaan.',
    'Di go-redis, TxPipeliner menjalankan blok MULTI/EXEC sedangkan rdb.Watch membungkus pola WATCH beserta callback di dalamnya.',
    'Pilih pipeline untuk kecepatan pengiriman, transaksi untuk kunci yang harus berubah bersama, dan Lua untuk keputusan yang harus berada tepat di samping datanya.'
  ]
});
