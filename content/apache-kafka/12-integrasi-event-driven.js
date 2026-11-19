/* ============================================================
   Pelajaran Apache Kafka — 12: Integrasi & Event-Driven Architecture
   ============================================================ */
'use strict';

window.KAFKA_LESSONS = window.KAFKA_LESSONS || [];

window.KAFKA_LESSONS.push({
  id: 'integrasi-event-driven',
  title: 'Integrasi & Event-Driven Architecture',
  chapter: 'Pola Desain',
  duration: '15 menit',
  intro: [
    'Kafka tidak hanya &quot;pengirim pesan&quot; — ia adalah tulang punggung integrasi antarlayanan. Ketika satu peristiwa bisnis (pesanan dibuat, profil diperbarui) mengalir sekali ke topic, puluhan layanan bisa bereaksi tanpa saling mengetahui satu sama lain. Inilah inti <b>event-driven architecture (EDA)</b>.',
    'Pelajaran ini memetakan pola-pola integrasi yang lazim memakai Kafka: <b>event notification, event-carried state transfer, event sourcing, CQRS</b>, hingga perbandingan <b>choreography vs orchestration</b> — plus cara memilih pola yang tepat dan menghindari anti-pattern integrasi yang berujung tightly-coupled kembali.'
  ],
  objectives: [
    'Menjelaskan empat pola integrasi berbasis event: notification, state transfer, event sourcing, dan CQRS',
    'Membandingkan choreography dan orchestration beserta trade-off-nya',
    'Menguraikan satu skenario integrasi microservices end-to-end dengan Kafka',
    'Mengenali anti-pattern integrasi event-driven dan cara menghindarinya'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Empat pola integrasi berbasis event</h3><table><thead><tr><th>Pola</th><th>Inti</th><th>Cocok untuk</th></tr></thead><tbody><tr><td><b>Event notification</b></td><td>Event memberi tahu &quot;ada yang terjadi&quot; — payload ringkas, penerima menarik data sendiri</td><td>Sinkronisasi, notifikasi, trigger proses</td></tr><tr><td><b>Event-carried state transfer</b></td><td>Event membawa <b>salinan data</b> yang cukup lengkap — penerima tak perlu memanggil service asal</td><td>Mengurangi ketergantungan RPC antarlayanan</td></tr><tr><td><b>Event sourcing</b></td><td>Database disimpan sebagai <b>urutan event</b>; state terbaru = hasil rekayasa ulang seluruh event</td><td>Jejak audit lengkap, keuangan, undo/redo</td></tr><tr><td><b>CQRS</b></td><td>Pisahkan <b>model tulis</b> dan <b>model baca</b> — baca disajikan dari projection yang dibangun dari event</td><td>Baca jauh lebih berat dari tulis, tampilan khusus</td></tr></tbody></table><p>Empat pola ini sering dipakai bersama: mis. sistem pesanan memakai <b>event-carried state transfer</b> untuk konsumen ringan, sementara laporan keuangan memakai <b>CQRS</b> dengan projection dari <b>event sourcing</b>.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 330" width="760" role="img" aria-label="Integrasi microservices dengan Kafka: satu event pesanan dibaca banyak layanan untuk pola yang berbeda">
        <rect x="20" y="40" width="150" height="70" rx="8" class="u-hd"/>
        <text x="95" y="70" class="u-title" text-anchor="middle">order-service</text>
        <text x="95" y="94" class="u-lbl" text-anchor="middle">tulis DB + produce</text>
        <line x1="176" y1="75" x2="236" y2="75" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="242" y="24" width="240" height="270" rx="10" class="u-box"/>
        <text x="362" y="50" class="u-title" text-anchor="middle">Topic: order-events</text>
        <line x1="256" y1="60" x2="468" y2="60" class="u-line"/>
        <rect x="256" y="74" width="212" height="50" rx="6" class="u-hd"/>
        <text x="362" y="96" class="u-lbl" text-anchor="middle">order.created</text>
        <text x="362" y="116" class="u-lbl" text-anchor="middle">payload: state transfer</text>
        <rect x="256" y="134" width="212" height="50" rx="6" class="u-box"/>
        <text x="362" y="156" class="u-lbl" text-anchor="middle">order.paid</text>
        <text x="362" y="176" class="u-lbl" text-anchor="middle">notification trigger</text>
        <rect x="256" y="194" width="212" height="50" rx="6" class="u-box"/>
        <text x="362" y="216" class="u-lbl" text-anchor="middle">order.shipped</text>
        <text x="362" y="236" class="u-lbl" text-anchor="middle">audit / event sourcing</text>
        <text x="362" y="276" class="u-lbl" text-anchor="middle">banyak consumer, satu peristiwa</text>
        <line x1="488" y1="99" x2="552" y2="66" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="488" y1="159" x2="552" y2="159" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="488" y1="219" x2="552" y2="252" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="558" y="36" width="182" height="60" rx="8" class="u-hd"/>
        <text x="649" y="62" class="u-title" text-anchor="middle">notification-service</text>
        <text x="649" y="86" class="u-lbl" text-anchor="middle">kirim surel (baca ringkas)</text>
        <rect x="558" y="129" width="182" height="60" rx="8" class="u-box"/>
        <text x="649" y="155" class="u-title" text-anchor="middle">analytics-service</text>
        <text x="649" y="179" class="u-lbl" text-anchor="middle">projection / CQRS read</text>
        <rect x="558" y="222" width="182" height="60" rx="8" class="u-box"/>
        <text x="649" y="248" class="u-title" text-anchor="middle">audit-service</text>
        <text x="649" y="272" class="u-lbl" text-anchor="middle">riwayat peristiwa</text>
      </svg></div><figcaption>Satu topic menjangkau banyak layanan dengan pola berbeda — tanpa layanan saling memanggil.</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Notification vs state transfer dalam satu event',
      lang: 'json',
      output: false,
      code: `NOTIFICATION (payload ringkas — penerima tarik data sendiri)
{
  "event_type": "order.created",
  "event_id": "evt-10001",
  "occurred_at": "2026-11-18T10:00:00Z",
  "data": { "order_id": "ORD-1001" }
}

STATE TRANSFER (payload membawa salinan yang cukup lengkap)
{
  "event_type": "order.created",
  "event_id": "evt-10001",
  "occurred_at": "2026-11-18T10:00:00Z",
  "data": {
    "order_id": "ORD-1001",
    "user_id": "USR-1001",
    "user_email": "andi@example.id",
    "items": [{ "sku": "SKU-1", "qty": 2, "price": 125000 }],
    "total": 250000,
    "currency": "IDR"
  }
}`,
      explain: [
        '<b>Notification</b> hemat dan selalu segar, tetapi setiap penerima harus memanggil service order — bila order-service mati, alur berhenti.',
        '<b>State transfer</b> membuat penerima mandiri: analitik bisa memproses tanpa perlu menghubungi order-service sama sekali (melainkan trade-off: payload lebih besar dan bisa kedaluwarsa bila tidak diperbarui).',
        'Kombinasi yang lazim: <b>ringkas untuk trigger, lengkap untuk data yang sering dibutuhkan</b> — atau dua topic bila kebutuhannya berbeda jauh.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Choreography vs orchestration</h3><p>Dua cara mengatur alur multi-layanan:</p><ul><li><b>Choreography</b> — tidak ada pusat; tiap layanan mendengarkan event dan bereaksi. Sederhana &amp; longgar, tetapi alur sulit dilacak saat berbelit.</li><li><b>Orchestration</b> — satu koordinator (bisa berupa service saga atau Kafka Streams) memerintahkan langkah demi langkah. Alur jelas &amp; mudah diawasi, tetapi koordinator menjadi titik fokus kompleksitas.</li></ul><p>Trade-off praktis: <b>choreography untuk alur pendek (2–3 layanan)</b>, <b>orchestration ketika alur panjang, banyak pengecualian, dan butuh visibilitas</b> (mis. saga pembayaran yang bisa gagal di tengah).</p>'
    },
    {
      type: 'example',
      title: 'Alur pesanan: dari HTTP ke event',
      lang: 'text',
      output: false,
      code: `SINKRON LAMA (tightly-coupled)
POST /orders → order-service
  → order-service panggil payment-service (HTTP)
  → order-service panggil inventory-service (HTTP)
  → order-service panggil notification-service (HTTP)
  GAGAL di langkah ke-3 = orkestrasi manual, compansate satu-satu

EVENT-DRIVEN (choreography)
Client → POST /orders → order-service: simpan + produce order.created
  payment-service   ──dengar order.created──▶ bayar → produce order.paid
  inventory-service ──dengar order.paid─────▶ kurangi stok → produce stock.reduced
  notification      ──dengar order.paid─────▶ kirim surel
  Setiap layanan bertanggung jawab atas reaksinya sendiri.

YANG BERUBAH SECARA FUNDAMENTAL
  • order-service tidak perlu tahu siapa saja penerima
  • kegagalan satu penerima tidak menahan pengirim
  • layanan baru tinggal subscribe (tanpa mengubah order-service)`,
      explain: [
        'Pada pola sinkron lama, order-service menjadi <b>orkestrator paksa</b> yang harus tahu semua dependensi dan menangani kompensasi tiap kegagalan.',
        'Pada choreography, tanggung jawab tersebar: tiap layanan <b>memutuskan sendiri</b> apa yang harus dilakukan ketika menerima peristiwa.',
        'Yang perlu diwaspadai: ketika alur sudah panjang, jejak &quot;kenapa pesanan ini belum bayar?&quot; menjadi sulit dilacak — itulah tanda perlu pindah ke <b>orchestration/saga</b> atau menambah correlation_id + audit trail.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Skenario end-to-end: satu peristiwa, banyak pembaca</h3><p>Mari rangkai semuanya pada satu skenario (dipakai lagi di Proyek Akhir):</p><ol><li><b>order-service</b> menerima pesanan → menyimpan ke database → <b>produce</b> <code>order.created</code> (state transfer).</li><li><b>payment-service</b> menerima event → memproses pembayaran → produce <code>order.paid</code>.</li><li><b>inventory-service</b> bereaksi pada <code>order.paid</code> → memangkas stok (idempoten).</li><li><b>notification-service</b> mengirim surel/push pada <code>order.paid</code>.</li><li><b>analytics-service</b> membangun <b>projection</b> penjualan per jam (CQRS read model).</li><li><b>audit-service</b> menyimpan seluruh event (jejak riwayat).</li></ol><p>Perhatikan: tiap layanan punya <b>group.id sendiri</b>, sehingga semuanya membaca penuh tanpa saling berebut. Itulah keunggulan fan-out Kafka dibanding antrean klasik.</p>'
    },
    {
      type: 'text',
      html: '<h3>Anti-pattern integrasi event-driven</h3><ul><li><b>Event sebagai RPC tersembunyi</b> — memakai event untuk meminta balasan (reply topic) padahal kebutuhannya request-response → pertimbangkan RPC biasa.</li><li><b>Terlalu banyak topic tanpa aturan</b> — satu topic per entitas/domain, bukan per-tim atau per-event acak; penamaan konsisten (<code>entity.verb</code>).</li><li><b>Choreography tanpa batas</b> — alur 8 langkah tanpa orkestrator membuat debugging mimpi buruk.</li><li><b>Event membawa data rahasia</b> — sama seperti pelajaran desain event; sekali tayang, sulit ditarik.</li><li><b>Mengabaikan idempotensi penerima</b> — at-least-once membuat duplikat itu pasti; tiap consumer wajib siap.</li></ul>'
    },
    {
      type: 'warn',
      title: 'Kapan Kafka BUKAN pilihan untuk integrasi',
      text: '<ul><li><b>Butuh balasan seketika</b> — cek stok real-time, validasi kartu → HTTP/RPC.</li><li><b>Alur sangat sederhana dan linear</b> — dua service, tanpa fan-out → antrean ringan (RabbitMQ/SQS) bisa lebih sederhana.</li><li><b>Data sekali pakai tanpa riwayat</b> — bila tak pernah butuh replay, manfaat log besar Kafka tidak terpakai.</li><li><b>Tim belum siap operasional</b> — Kafka menuntut disiplin monitoring, partition, dan retensi; mulailah dari scope kecil dulu.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Aturan pilih pola dengan cepat',
      text: '<p>Tiga pertanyaan: (1) <b>Butuh balasan?</b> ya → RPC. (2) <b>Butuh banyak pembaca / riwayat?</b> ya → event streaming Kafka. (3) <b>Alurnya berbelit dengan pengecualian?</b> ya → orchestration/saga; sederhana 2–3 langkah → choreography. Jawaban tiga pertanyaan ini biasanya langsung menuntun ke keputusan yang tepat.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Event-driven architecture', 'Arsitektur yang memakai event sebagai alur komunikasi utama.'],
        ['Event notification', 'Event ringkas sebagai pemberitahuan peristiwa.'],
        ['Event-carried state transfer', 'Event membawa salinan data agar penerima mandiri.'],
        ['Event sourcing', 'Menyimpan riwayat event sebagai sumber kebenaran utama.'],
        ['CQRS', 'Memisahkan model tulis dan model baca.'],
        ['Choreography', 'Koordinasi tanpa pusat: tiap layanan bereaksi sendiri.'],
        ['Orchestration', 'Koordinator pusat mengatur langkah alur bisnis.'],
        ['Saga', 'Alur transaksi lintas layanan dengan kompensasi saat gagal.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Jelaskan perbedaan <b>notification</b> dan <b>state transfer</b> dengan satu contoh masing-masing.</li><li>Mengapa fan-out Kafka bisa melayani banyak layanan sekaligus, sementara queue tidak?</li><li>Bandingkan choreography dan orchestration: kapan masing-masing menang?</li><li>Pada skenario end-to-end, sebutkan <b>group.id</b> apa yang dipakai tiap layanan dan mengapa tidak dipakai bersama.</li><li>Sebutkan 3 anti-pattern integrasi event-driven dan akibatnya.</li></ol>'
    }
  ],
  recap: [
    'Empat pola integrasi: <b>notification</b> (ringkas), <b>state transfer</b> (payload mandiri), <b>event sourcing</b> (riwayat = kebenaran), <b>CQRS</b> (model tulis ≠ model baca).',
    '<b>Choreography</b> (tanpa pusat) untuk alur pendek; <b>orchestration/saga</b> untuk alur berbelit yang butuh visibilitas dan kompensasi.',
    'Kafka memungkinkan <b>satu peristiwa dibaca banyak layanan</b> dengan group.id masing-masing — pengirim tidak pernah tahu siapa penerima.',
    'Waspadai anti-pattern: <b>event sebagai RPC, topic acak, choreography tanpa batas, data rahasia, consumer tanpa idempotensi</b>.'
  ]
});
