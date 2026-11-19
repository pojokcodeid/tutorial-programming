/* ============================================================
   Pelajaran Apache Kafka — 19: Kafka Streams & ksqlDB
   ============================================================ */
'use strict';

window.KAFKA_LESSONS = window.KAFKA_LESSONS || [];

window.KAFKA_LESSONS.push({
  id: 'kafka-streams-ksqldb',
  title: 'Kafka Streams & ksqlDB',
  chapter: 'Ekosistem',
  duration: '15 menit',
  intro: [
    'Kafka menyimpan dan memindahkan data; tetapi sering kali kamu ingin <b>memprosesnya di tengah jalan</b> — mengagregasi penjualan per jam, menggabungkan dua stream, memfilter noise, atau membangun materialized view. Untuk itu ekosistem menyediakan dua alat: <b>Kafka Streams</b> (pustaka Java/Kotlin untuk aplikasi) dan <b>ksqlDB</b> (SQL interaktif di atas stream Kafka).',
    'Pelajaran ini membedah konsep inti yang sama di keduanya: <b>stream vs table</b>, <b>time window</b>, <b>state store</b>, dan <b>KTable/KStream</b> — lalu membandingkan kapan memilih pustaka versus SQL, beserta pola penggunaan yang paling umum: agregasi, join, deduplikasi, dan windowed aggregation.'
  ],
  objectives: [
    'Menjelaskan perbedaan stream dan table serta konsep time window',
    'Menjelaskan arsitektur Kafka Streams: topology, state store, dan repartition',
    'Menulis contoh operasi umum: filter, map, agregasi, dan join',
    'Membandingkan Kafka Streams dan ksqlDB serta memilih yang tepat'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Stream dan table: dua cara memandang data</h3><ul><li><b>Stream</b> — urutan record yang terus mengalir; setiap record adalah fakta baru pada waktunya (pesanan masuk, klik, pembacaan sensor). Stream bersifat <b>append-only</b> dan tidak pernah &quot;berubah&quot; — hanya ditambah.</li><li><b>Table</b> — <b>state terkini</b> per kunci; setiap record memperbarui baris (saldo rekening, profil pengguna, jumlah stok). Table adalah hasil <b>pengurangan</b> stream terhadap kunci.</li></ul><p>Hubungan keduanya fundamental: <b>table adalah snapshot dari stream</b>. Ketika kamu membutuhkan &quot;nilai terbaru untuk key X&quot;, kamu membutuhkan table; ketika kamu membutuhkan &quot;setiap peristiwa yang terjadi&quot;, kamu membutuhkan stream.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 330" width="760" role="img" aria-label="Alur Kafka Streams: stream masuk diproses lewat topology dengan state store lalu menghasilkan stream keluaran">
        <rect x="20" y="40" width="150" height="70" rx="8" class="u-box"/>
        <text x="95" y="68" class="u-title" text-anchor="middle">Topic in</text>
        <text x="95" y="92" class="u-lbl" text-anchor="middle">order-events</text>
        <line x1="176" y1="75" x2="234" y2="75" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="240" y="20" width="300" height="250" rx="10" class="u-box"/>
        <text x="390" y="48" class="u-title" text-anchor="middle">Kafka Streams topology</text>
        <line x1="256" y1="58" x2="524" y2="58" class="u-line"/>
        <rect x="256" y="72" width="268" height="40" rx="5" class="u-hd"/>
        <text x="390" y="97" class="u-lbl" text-anchor="middle">filter + map (per record)</text>
        <rect x="256" y="122" width="268" height="40" rx="5" class="u-hd"/>
        <text x="390" y="147" class="u-lbl" text-anchor="middle">groupBy + aggregate (repartition)</text>
        <rect x="256" y="172" width="268" height="40" rx="5" class="u-box"/>
        <text x="390" y="197" class="u-lbl" text-anchor="middle">state store: penjualan per jam</text>
        <rect x="256" y="222" width="268" height="36" rx="5" class="u-box"/>
        <text x="390" y="245" class="u-lbl" text-anchor="middle">window: 1 jam (tumbling)</text>
        <line x1="546" y1="130" x2="604" y2="130" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="610" y="96" width="130" height="70" rx="8" class="u-hd"/>
        <text x="675" y="124" class="u-title" text-anchor="middle">Topic out</text>
        <text x="675" y="148" class="u-lbl" text-anchor="middle">sales-per-hour</text>
        <rect x="20" y="286" width="720" height="34" rx="6" class="u-box"/>
        <text x="380" y="308" class="u-lbl" text-anchor="middle">state store lokal + changelog topic untuk pemulihan &amp; rebalance</text>
      </svg></div><figcaption>Streams memproses record satu per satu; agregasi menghasilkan state yang disimpan di state store dengan changelog untuk pemulihan.</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Time window</h3><p>Karena stream tak berhenti, kamu perlu <b>potongan waktu</b> untuk mengagregasi. Tiga bentuk utama:</p><ul><li><b>Tumbling</b> — jendela berdampingan tanpa tumpang tindih (per jam: 10:00–11:00, 11:00–12:00).</li><li><b>Hopping</b> — jendela dengan langkah lebih kecil dari ukurannya (ukuran 1 jam, langkah 10 menit → tiap record masuk ke beberapa jendela).</li><li><b>Session</b> — jendela dinamis yang tumbuh diam saat ada aktivitas dan berakhir setelah jeda waktu tertentu (basi untuk perilaku pengguna).</li></ul><p>Pilihan jendela menentukan makna hasil: <b>penjualan per jam</b> = tumbling; <b>tingkat pengguna aktif 5 menit terakhir</b> = hopping; <b>sesi browsing</b> = session.</p>'
    },
    {
      type: 'example',
      title: 'Kafka Streams: agregasi penjualan per jam (Java)',
      lang: 'java',
      output: false,
      code: `StreamsBuilder builder = new StreamsBuilder();

KStream<String, OrderEvent> orders =
    builder.stream("order-events", Consumed.with(Serdes.String(), orderSerde));

orders
  .filter((k, v) -> v != null && "PAID".equals(v.getStatus()))
  .map((k, v) -> new KeyValue<>(v.getUserId(), v))          // repartition by user
  .groupByKey()
  .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofHours(1)))
  .aggregate(
      () -> 0L,                                             // kasir awal
      (user, order, total) -> total + order.getTotal(),     // tambah
      Materialized.<String, Long, WindowStore<Bytes, byte[]>>as("sales-per-hour")
          .withKeySerde(Serdes.String())
          .withValueSerde(Serdes.Long())
  )
  .toStream()
  .map((windowedKey, total) ->
      new KeyValue<>(windowedKey.key() + "@" + windowedKey.window().startTime(), total))
  .to("sales-per-hour", Produced.with(Serdes.String(), Serdes.Long()));`,
      explain: [
        '<code>filter</code> dan <code>map</code> bekerja <b>per record</b> tanpa menyimpan state — murah dan paralel per partition.',
        '<code>groupByKey</code> memicu <b>repartition</b>: record dipindah ke partition sesuai kunci baru agar agregasi benar — inilah titik termahal dalam topology, minimalkan dengan memilih kunci yang tepat sejak awal.',
        '<code>Materialized.as(...)</code> membuat <b>state store</b> lokal yang otomatis memiliki <b>changelog topic</b> — ketika proses mati, state dibangun ulang dari changelog tanpa membaca seluruh stream dari nol.'
      ]
    },
    {
      type: 'example',
      title: 'ksqlDB: agregasi yang sama tanpa kode',
      lang: 'sql',
      output: false,
      code: `-- stream dari topic (skema diinferensikan atau didefinisikan)
CREATE STREAM orders (
  order_id VARCHAR,
  user_id  VARCHAR,
  status   VARCHAR,
  total    BIGINT
) WITH (
  KAFKA_TOPIC='order-events',
  VALUE_FORMAT='AVRO',
  PARTITIONS=6
);

-- hanya pesanan yang dibayar
CREATE STREAM paid_orders AS
  SELECT * FROM orders WHERE status = 'PAID';

-- penjualan per jam per pengguna (tumbling 1 jam)
CREATE TABLE sales_per_hour AS
  SELECT user_id,
         HOPPING_WINDOW(timestamp, 3600000, 3600000) AS window,
         SUM(total) AS revenue,
         COUNT(*)   AS orders
  FROM paid_orders
  GROUP BY user_id, HOPPING_WINDOW(timestamp, 3600000, 3600000)
  EMIT CHANGES;

-- baca hasilnya seperti tabel biasa
SELECT * FROM sales_per_hour WHERE user_id = 'USR-1001' EMIT CHANGES;`,
      explain: [
        '<code>CREATE STREAM ... AS SELECT</code> (CSAS) dan <code>CREATE TABLE ... AS SELECT</code> (CTAS) adalah inti ksqlDB: satu pernyataan SQL menghasilkan topik baru yang terus diperbarui.',
        '<code>HOPPING_WINDOW</code> mendefinisikan jendela; di Kafka Streams kamu mengatur lewat <code>TimeWindows</code> — konsepnya identik, hanya sintaksnya berbeda.',
        '<code>EMIT CHANGES</code> menandai query kontinu: hasilnya <b>terus mengalir</b> ke tabel/materialized view, bukan sekadar snapshot pada saat dijalankan.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Kafka Streams vs ksqlDB</h3><table><thead><tr><th>Aspek</th><th>Kafka Streams</th><th>ksqlDB</th></tr></thead><tbody><tr><td><b>Bentuk</b></td><td>Pustaka Java/Kotlin — bagian dari aplikasi</td><td>Server + SQL — layanan terpisah</td></tr><tr><td><b>Ekspresivitas</b></td><td>Penuh: join kompleks, custom processor, serat ke library</td><td>Terbatas pada operator SQL yang tersedia</td></tr><tr><td><b>Kecepatan mulai</b></td><td>Perlu proyek, build, deployment</td><td>Satu pernyataan SQL</td></tr><tr><td><b>Pengembang</b></td><td>Tim backend yang nyaman dengan JVM</td><td>Analisis data / engineer yang nyaman SQL</td></tr><tr><td><b>Pengelolaan</b></td><td>Terikat pada aplikasi Anda</td><td>Query dikelola server, ada UI/CLI</td></tr><tr><td><b>Cocok untuk</b></td><td>Logika pemrosesan yang menjadi bagian produk</td><td>Transformasi cepat, eksplorasi, pipeline ringan</td></tr></tbody></table><p>Pertimbangan praktis: mulailah dari <b>ksqlDB untuk prototipe</b> (menit), lalu pindahkan ke <b>Kafka Streams bila logikanya tumbuh</b> menjadi bagian dari aplikasi inti yang butuh pengujian, deployment terpadu, dan kontrol penuh.</p>'
    },
    {
      type: 'text',
      html: '<h3>Operasi umum dan perangkapnya</h3><ul><li><b>Filter &amp; map</b> — murah, tanpa state, aman diparalelkan per partition.</li><li><b>Join</b> — stream–stream butuh jendela waktu (kedua sisi harus tiba dalam rentang tertentu); stream–table (lookup) memakai table terkini per kunci.</li><li><b>Agregasi</b> — selalu memicu <b>repartition</b> dan <b>state store</b>; perhatikan ukuran state dan retensi changelog.</li><li><b>Deduplikasi</b> — pakai <b>event_id</b> sebagai kunci + jendela waktu; jangan berharap stream bebas duplikat.</li><li><b>Grace period</b> — tanpa grace, record terlambat bisa masuk jendela yang sudah ditutup dan menyebabkan inkonsistensi; tentukan toleransi keterlambatan.</li></ul>'
    },
    {
      type: 'warn',
      title: 'Jebakan Kafka Streams & ksqlDB',
      text: '<ul><li><b>Mengabaikan repartition</b> — setiap kali kunci berubah, data pindah partition; biayanya nyata. Pilih kunci yang tepat sebelum <code>groupByKey</code>.</li><li><b>State store tanpa batas</b> — agregasi tanpa jendela menumpuk tanpa henti; gunakan jendela atau retensi yang disengaja.</li><li><b>Late events tanpa grace</b> — data terlambat hilang atau mengubah hasil lama; pilih grace period sesuai karakteristik sumber.</li><li><b>Menjalankan dua instance untuk HA tanpa memahami standby</b> — Streams mendukung standby replicas untuk mempercepat pemulihan, bukan sekadar menyalin beban.</li><li><b>Query ksqlDB dianggap transaksional</b> — hasilnya setidaknya sekali; tetap siapkan idempotensi di hilir.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Cara cepat memilih',
      text: '<p>Pertanyaan tiga langkah: (1) <b>Perlu SQL?</b> untuk eksplorasi/prototipe → ksqlDB. (2) <b>Logika jadi bagian aplikasi dengan test &amp; CI?</b> → Kafka Streams. (3) <b>Butuh operator yang tidak ada di SQL?</b> → Streams (atau Flink bila kebutuhannya jauh melampaui Kafka). Pilihan ini bukan sekali pakai — banyak tim memakai ksqlDB di awal lalu memindahkan bagian penting ke Streams seiring kebutuhan.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Kafka Streams', 'Pustaka Java/Kotlin untuk memproses stream Kafka di dalam aplikasi.'],
        ['ksqlDB', 'Server SQL interaktif untuk query dan transformasi stream Kafka.'],
        ['Stream', 'Urutan record append-only; setiap record adalah fakta baru.'],
        ['Table', 'State terkini per kunci — hasil pengurangan stream.'],
        ['State store', 'Penyimpanan lokal hasil agregasi/join yang bisa dibangun ulang.'],
        ['Changelog topic', 'Topic yang merekam perubahan state store untuk pemulihan.'],
        ['Repartition', 'Pemindahan record antarpartition karena kunci berubah.'],
        ['Time window', 'Potongan waktu untuk agregasi: tumbling, hopping, session.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Jelaskan hubungan <b>stream</b> dan <b>table</b> dengan satu contoh nyata.</li><li>Mengapa <code>groupByKey</code> memicu repartition, dan apa biayanya?</li><li>Bedakan <b>tumbling</b>, <b>hopping</b>, dan <b>session</b> window dengan skenario masing-masing.</li><li>Tulis ulang agregasi penjualan per jam dalam ksqlDB — bandingkan barisnya dengan versi Java.</li><li>Bila state store hilang karena proses mati, bagaimana Streams memulihkannya?</li></ol>'
    }
  ],
  recap: [
    '<b>Stream</b> = urutan fakta (append-only); <b>table</b> = state terkini per kunci — table adalah snapshot stream.',
    '<b>Kafka Streams</b> = pustaka dengan topology (filter, map, aggregate, join) dan <b>state store</b> + changelog.',
    '<b>ksqlDB</b> = SQL atas stream: <code>CREATE STREAM/TABLE AS SELECT</code> + jendela waktu — cepat untuk prototipe.',
    'Agregasi memicu <b>repartition</b> &amp; state store; perhatikan <b>grace period</b> untuk event terlambat.'
  ]
});
