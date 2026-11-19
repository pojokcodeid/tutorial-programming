/* ============================================================
   Pelajaran Apache Kafka — 15: Transactional Outbox Pattern
   ============================================================ */
'use strict';

window.KAFKA_LESSONS = window.KAFKA_LESSONS || [];

window.KAFKA_LESSONS.push({
  id: 'transactional-outbox',
  title: 'Transactional Outbox Pattern',
  chapter: 'Pola Desain',
  duration: '15 menit',
  intro: [
    'Bayangkan skenario ini: pembayaran berhasil disimpan ke database, lalu layanan mencoba mengirim event ke Kafka — tetapi jaringan terputus tepat di antara dua langkah itu. Database menyatakan &quot;sudah&quot;, Kafka menyatakan &quot;belum&quot; — dan tidak ada transaksi yang mencakup keduanya. Masalah klasik ini disebut <b>dual-write problem</b>.',
    'Pelajaran ini membahas <b>transactional outbox pattern</b>: cara menulis perubahan database dan catatan event dalam <b>satu transaksi yang sama</b>, lalu mendistribusikannya ke Kafka lewat <b>CDC (Debezium)</b> atau <b>relay/relay-polling</b> — beserta alternatifnya (dual write berisiko, event dua fase) dan kapan pola ini benar-benar dibutuhkan.'
  ],
  objectives: [
    'Menjelaskan dual-write problem dan mengapa menulis DB + Kafka secara terpisah berisiko',
    'Menguraikan langkah transactional outbox: tulis dalam satu transaksi lalu distribusikan',
    'Membandingkan distribusi outbox via CDC (Debezium) vs polling relay',
    'Menimbang alternatif: dua transaksi, event dua fase, dan kapan outbox tidak wajib'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Dual-write problem</h3><p>Ketika satu aksi bisnis harus (a) mengubah database dan (b) mengirim event, ada dua penulisan yang <b>tidak bisa dicakup transaksi yang sama</b> (database dan Kafka adalah dua sistem berbeda). Skenario kegagalannya:</p><ul><li><b>DB sukses, Kafka gagal</b> — data tersimpan, tetapi tidak ada yang tahu → layanan lain ketinggalan.</li><li><b>Kafka sukses, DB gagal</b> — event beredar, tetapi tidak ada perubahan nyata → informasi palsu.</li></ul><p>Urutan mana pun tetap meninggalkan celah di antara dua penulisan. Inilah alasan pola outbox lahir: <b>jangan pernah menulis dua sistem dalam satu langkah tanpa rencana rekonsiliasi</b>.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 330" width="760" role="img" aria-label="Transactional outbox: perubahan DB dan event outbox dalam satu transaksi lalu didistribusikan ke Kafka">
        <rect x="20" y="30" width="180" height="70" rx="8" class="u-hd"/>
        <text x="110" y="58" class="u-title" text-anchor="middle">order-service</text>
        <text x="110" y="82" class="u-lbl" text-anchor="middle">terima pesanan</text>
        <line x1="206" y1="65" x2="252" y2="65" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="258" y="20" width="300" height="130" rx="10" class="u-box"/>
        <text x="408" y="46" class="u-title" text-anchor="middle">Database (satu transaksi)</text>
        <line x1="272" y1="56" x2="544" y2="56" class="u-line"/>
        <rect x="272" y="70" width="272" height="34" rx="5" class="u-hd"/>
        <text x="408" y="92" class="u-lbl" text-anchor="middle">INSERT orders (order_id ORD-1001)</text>
        <rect x="272" y="112" width="272" height="30" rx="5" class="u-hd"/>
        <text x="408" y="132" class="u-lbl" text-anchor="middle">INSERT outbox (event order.created)</text>
        <line x1="408" y1="156" x2="408" y2="190" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="258" y="196" width="300" height="64" rx="8" class="u-box"/>
        <text x="408" y="222" class="u-title" text-anchor="middle">Relay: CDC Debezium ATAU poll</text>
        <text x="408" y="246" class="u-lbl" text-anchor="middle">baca baris outbox → produce ke Kafka</text>
        <line x1="564" y1="228" x2="622" y2="228" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="628" y="196" width="112" height="64" rx="8" class="u-hd"/>
        <text x="684" y="222" class="u-title" text-anchor="middle">Kafka</text>
        <text x="684" y="246" class="u-lbl" text-anchor="middle">order.created</text>
        <rect x="20" y="196" width="216" height="64" rx="8" class="u-hd"/>
        <text x="128" y="222" class="u-title" text-anchor="middle">Jaminan</text>
        <text x="128" y="246" class="u-lbl" text-anchor="middle">DB &amp; outbox = atomik</text>
        <rect x="20" y="282" width="720" height="40" rx="8" class="u-box"/>
        <text x="380" y="307" class="u-lbl" text-anchor="middle">gagal di relay? baris outbox tetap ada → dicoba lagi (at-least-once, idempoten)</text>
      </svg></div><figcaption>Perubahan data dan catatan event ditulis atomik dalam satu transaksi database, lalu relay mendistribusikannya ke Kafka.</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Langkah transactional outbox</h3><ol><li><b>Tulis dalam satu transaksi</b> — ketika aksi bisnis terjadi, aplikasi melakukan <code>INSERT/UPDATE</code> tabel bisnis <i>dan</i> <code>INSERT</code> satu baris ke tabel <b><code>outbox</code></b> dalam transaksi database yang sama.</li><li><b>Transaksi commit</b> — keduanya berhasil bersama atau batal bersama. Tidak ada kondisi &quot;data berubah tapi event tidak ada&quot;.</li><li><b>Distribusikan</b> — komponen terpisah membaca tabel outbox dan <b>me-produce</b> isinya ke Kafka (via CDC atau polling).</li><li><b>Tandai/rapikan</b> — setelah terkonfirmasi terkirim, baris outbox ditandai (dihapus/diarsipkan) sesuai retensi.</li></ol><p>Yang penting: <b>tidak ada lagi dual-write di lapisan aplikasi</b> — Kafka menjadi konsekuensi dari perubahan database, bukan penulisan paralel yang bisa gagal sendirian.</p>'
    },
    {
      type: 'example',
      title: 'Tabel outbox dan relay sederhana',
      lang: 'sql',
      output: false,
      code: `-- TABEL OUTBOX
CREATE TABLE outbox (
  id            BIGSERIAL PRIMARY KEY,
  aggregate_id  VARCHAR(64)  NOT NULL,   -- mis. order_id
  event_type    VARCHAR(64)  NOT NULL,   -- order.created
  payload       JSONB        NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  published_at  TIMESTAMPTZ             -- NULL = belum terkirim
);

-- SATU transaksi: bisnis + outbox atomik
BEGIN;
  INSERT INTO orders (id, user_id, total) VALUES ('ORD-1001', 'USR-1001', 250000);
  INSERT INTO outbox (aggregate_id, event_type, payload)
  VALUES ('ORD-1001', 'order.created',
          '{"order_id":"ORD-1001","total":250000}');
COMMIT;   -- keduanya ada, atau keduanya tidak

-- RELAY (polling): kirim yang belum terkirim, lalu tandai
SELECT id, event_type, payload FROM outbox
WHERE published_at IS NULL ORDER BY id LIMIT 100;
-- produce ke Kafka (sukses) lalu:
UPDATE outbox SET published_at = now() WHERE id = ANY(:ids);`,
      explain: [
        'Kolom <code>published_at</code> menandai status: <code>NULL</code> berarti relay masih harus mengirim — inilah &quot;daftar tugas&quot; yang membuat kegagalan bisa <b>dipulihkan otomatis</b>.',
        'Relay berjalan <b>setidaknya sekali</b> (bila gagal setelah produce sebelum update, baris akan dikirim lagi) — karena itu consumer wajib <b>idempoten</b> (memakai <code>event_id</code>).',
        'Alternatif polling adalah <b>CDC/Debezium</b> yang membaca <i>change data capture</i> langsung dari WAL database — tanpa interval polling, latency lebih kecil (dibahas di pelajaran Kafka Connect &amp; CDC).'
      ]
    },
    {
      type: 'text',
      html: '<h3>CDC (Debezium) vs polling relay</h3><table><thead><tr><th>Aspek</th><th>CDC / Debezium</th><th>Polling relay</th></tr></thead><tbody><tr><td><b>Cara kerja</b></td><td>Membaca log perubahan database (WAL) secara streaming</td><td>Query periodik tabel outbox</td></tr><tr><td><b>Latensi</b></td><td>Sangat rendah (near real-time)</td><td>Tergantung interval polling</td></tr><tr><td><b>Beban DB</b></td><td>Rendah (baca log)</td><td>Query berulang (perlu index published_at)</td></tr><tr><td><b>Kompleksitas</b></td><td>Lebih banyak komponen (Kafka Connect + connector)</td><td>Sederhana — kode aplikasi biasa</td></tr><tr><td><b>Cocok untuk</b></td><td>Produksi dengan latency ketat &amp; volume besar</td><td>Proyek kecil/menengah, latensi beberapa detik oke</td></tr></tbody></table>'
    },
    {
      type: 'example',
      title: 'Outbox di dalam kode layanan',
      lang: 'java',
      output: false,
      code: `@Transactional   // satu transaksi dengan operasi bisnis
public void createOrder(CreateOrderCommand cmd) {
    Order order = Order.create(cmd);
    orderRepository.save(order);                 // 1) perubahan bisnis

    outboxRepository.save(OutboxEvent.of(        // 2) catatan event, atomik
        order.getId(),
        "order.created",
        mapper.writeValueAsString(order.toEventData())
    ));
}

// terpisah dari transaksi: relay/connector mengirim isinya
// (polling @Scheduled atau Debezium Kafka Connect connector)`,
      explain: [
        'Karena keduanya berada dalam <code>@Transactional</code> yang sama, <b>tidak mungkin</b> terjadi kondisi order tersimpan tanpa event (atau sebaliknya).',
        'Aplikasi <b>tidak perlu lagi</b> memanggil producer Kafka di sini — pengiriman ditangani relay, sehingga kegagalan jaringan Kafka tidak membatalkan operasi bisnis.',
        'Bila relay gagal, transaksi tetap utuh dan baris outbox menunggu — <b>pemulihan menjadi otomatis</b>, bukan insiden manual.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Alternatif dan kapan outbox tidak wajib</h3><ul><li><b>Dual write apa adanya</b> — menulis DB lalu Kafka langsung. Paling sederhana, tetapi meninggalkan celah kegagalan di tengah; hanya layak bila kehilangan event sangat jarang dan ada rekonsiliasi berkala.</li><li><b>Dua transaksi + retry</b> — lebih baik dari dual write polos, tetapi tetap bisa menghasilkan duplikat/gagal di tengah.</li><li><b>Event dua fase</b> — tulis event sebagai <i>pending</i> di DB, kirim, lalu tandai; mirip outbox tetapi tanpa tabel terpisah.</li><li><b>Transactional produce (Kafka)</b> — menyelesaikan sisi Kafka, tetapi <b>tidak mencakup database eksternal</b> — celah dual-write antara DB dan Kafka tetap ada.</li></ul><p><b>Kapan outbox wajib?</b> Saat kehilangan/duplikasi event berdampak bisnis (pembayaran, stok, notifikasi wajib), kegagalan parsial tidak bisa ditoleransi, dan tidak ada proses rekonsiliasi manual. Untuk log non-kritis, dual write dengan monitoring sering sudah cukup.</p>'
    },
    {
      type: 'warn',
      title: 'Jebakan implementasi outbox',
      text: '<ul><li><b>Tabel outbox tanpa index pada published_at</b> — polling melambat drastis saat data menumpuk.</li><li><b>Menghapus baris terlalu dini</b> — bila produce sukses tetapi update gagal, baris hilang tanpa terkirim; lebih aman menandai (bukan menghapus) lalu arsipkan berkala.</li><li><b>Lupa urutan</b> — relay harus mengirim menurut urutan yang benar (per aggregate) agar event satu pesanan tidak terbalik.</li><li><b>Relay jadi single point tanpa pengawasan</b> — pantau umur baris belum terkirim (age) sebagai metrik; baris tua menandai relay macet.</li><li><b>Mengira outbox menggantikan idempotensi</b> — pengiriman tetap at-least-once; consumer tetap wajib idempoten.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Mulai ringan, siap naik ke CDC',
      text: '<p>Untuk belajar/MVP: <b>polling relay + index + penanda published_at</b> sudah sangat memadai dan mudah dipahami. Begitu latensi beberapa detik mulai mengganggu atau volume besar, transisikan relay ke <b>Kafka Connect + Debezium</b> tanpa mengubah struktur tabel outbox — pola yang sama, hanya mekanisme distribusinya yang naik kelas.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Dual-write problem', 'Risiko menulis dua sistem (DB + Kafka) tanpa jaminan kebersamaan.'],
        ['Transactional outbox', 'Menulis perubahan data dan event atomik dalam satu transaksi DB.'],
        ['Tabel outbox', 'Tabel penampung event yang menunggu didistribusikan.'],
        ['Relay', 'Komponen pembaca outbox yang produce ke Kafka.'],
        ['CDC (Change Data Capture)', 'Membaca perubahan database dari log (WAL) secara streaming.'],
        ['Debezium', 'Platform CDC populer yang terintegrasi dengan Kafka Connect.'],
        ['published_at', 'Penanda baris outbox sudah terkirim atau belum.'],
        ['At-least-once relay', 'Relay boleh mengirim ulang; konsumen harus idempoten.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Jelaskan dual-write problem dengan dua skenario kegagalannya.</li><li>Urutkan 4 langkah transactional outbox dan sebutkan bagaimana atomisitas tercapai.</li><li>Bandingkan CDC (Debezium) dan polling relay dari sisi latensi, beban DB, dan kompleksitas.</li><li>Mengapa setelah outbox pun consumer tetap harus idempoten?</li><li>Skenario: sistem notifikasi internal non-kritis — apakah outbox wajib? Beri alasanmu.</li></ol>'
    }
  ],
  recap: [
    '<b>Dual-write problem</b> — menulis DB dan Kafka terpisah selalu meninggalkan celah: salah satu bisa gagal sendirian.',
    '<b>Transactional outbox</b>: tulis perubahan bisnis + baris outbox dalam <b>satu transaksi</b>, lalu relay mendistribusikannya ke Kafka.',
    'Distribusi via <b>polling relay</b> (sederhana) atau <b>CDC/Debezium</b> (near real-time, beban DB rendah).',
    'Relay bersifat <b>at-least-once</b> → konsumen tetap idempoten; pantau umur baris belum terkirim sebagai metrik kesehatan.'
  ]
});
