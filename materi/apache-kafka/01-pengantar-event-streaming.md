# Pelajaran 1 — Apa Itu Apache Kafka? Kenapa Aplikasi Modern Butuh Kafka

> **Durasi:** ± 15 menit
> **Prasyarat:** dasar terminal, dasar JSON, pengertian dasar HTTP/REST dan microservices

---

## Tujuan belajar

Setelah pelajaran ini kamu bisa:

- Menjelaskan apa itu Apache Kafka dengan kalimatmu sendiri memakai analogi gudang paket.
- Membedakan komunikasi **sinkron** (request-response) dengan **asinkron** (message queue dan event streaming).
- Menjelaskan peran **producer, consumer, message/event**, dan prinsip event-driven architecture (EDA).
- Membandingkan **Kafka vs RabbitMQ vs Redis Pub/Sub vs database** beserta kapan masing-masing tepat dipakai.

---

## Cerita pembuka: pabrik dengan gudang raksasa

Bayangkan pabrik yang setiap menit memproduksi ribuan paket. Kalau setiap paket harus diantar langsung oleh kurir ke alamat penerima satu per satu, kurirnya kewalahan dan pabrik berhenti menunggu — produksi berhenti hanya karena penerima sedang sibuk.

Solusinya klasik: **gudang raksasa yang mencatat setiap paket.** Produksi tetap berjalan dan mencatat, penerima datang kapan saja mengambil paketnya, catatan tetap tersimpan untuk diperiksa ulang, dan beberapa penerima bisa mengambil paket yang sama (misal tim gudang, tim kurir, dan tim audit).

| Di pabrik | Di dunia data |
|-----------|---------------|
| Paket yang diproduksi | Event / record |
| Gudang raksasa | **Apache Kafka** |
| Catatan paket di gudang | Topic (tersimpan selama retensi) |
| Pabrik yang memproduksi | Producer |
| Kurir/penerima yang mengambil | Consumer |
| Nomor urut di catatan | Offset |

---

## Jadi, apa itu Apache Kafka?

**Apache Kafka** adalah platform *open source* untuk **distributed event streaming**. Pertama dikembangkan di LinkedIn tahun 2011, lalu menjadi proyek Apache Software Foundation. Secara singkat:

> **Kafka = tempat producer menulis event ke topic, event disimpan berurutan dalam partition, lalu consumer membacanya kapan saja — termasuk membacanya ulang dari awal.**

Tiga kemampuan intinya:

1. **Produce** — menerbitkan event dengan throughput tinggi (puluhan ribu per detik per broker).
2. **Store** — menyimpan event selama periode retensi yang kamu tentukan (jam, hari, atau ukuran byte).
3. **Consume** — membaca event secara real-time (streaming) maupun secara batch, serentak oleh banyak layanan.

Yang membedakan Kafka dari message broker biasa adalah sifatnya sebagai **distributed log**: data yang masuk **tetap tersimpan** selama retensi, sehingga bisa **dibaca ulang (replay)** dan bisa dibaca banyak pihak sekaligus.

```text
Producer ──produce──▶ [ Topic: order-created ] ──▶ Consumer pembayaran
                             │                    ──▶ Consumer notifikasi
                             └───────────────────▶ Consumer audit (replay dari awal)
```

---

## Sinkron vs asinkron

### Komunikasi sinkron (request-response)

Pengirim mengirim permintaan lalu **menunggu jawaban**. HTTP/REST dan gRPC contohnya. Cocok untuk data yang butuh jawaban seketika — cek saldo, login, tampilkan profil. Tetapi ada konsekuensinya:

- **Berurutan dan menunggu** — koneksi terbuka selama penerima memproses.
- **Saling tahu alamat** — pengirim harus tahu URL, port, dan format data penerima.
- **Gagal bersama** — penerima mati atau penuh, permintaan ditolak dan pengirim harus mengulang sendiri.

### Komunikasi asinkron

Pengirim cukup **menyerahkan data** lalu lanjut bekerja. Ada dua bentuk utama:

| Aspek | Message Queue | Event Streaming |
|-------|---------------|-----------------|
| Pola | Satu pesan dikonsumsi satu worker | Satu event disimpan, banyak pembaca |
| Fokus | Mengerjakan pekerjaan (job) | Mencatat fakta yang terjadi |
| Retensi | Hilang setelah diproses | Tersimpan selama retensi, bisa replay |
| Routing | Sangat fleksibel (exchange, binding) | Berdasarkan topic & partition |
| Contoh | RabbitMQ, SQS | Apache Kafka |

**Queue menjawab "siapa yang mengerjakan ini?", streaming menjawab "apa saja yang terjadi?".** Keduanya saling melengkapi.

```text
SINKRON (HTTP)                          ASINKRON (Kafka)
App A ──POST /order──▶ App B            App A ──▶ [ Topic ] ──▶ App B
        ◀──201 Created──                        │
        (App A menunggu; App B mati              └──▶ App C (audit)
         = App A ikut gagal)                      (App A tidak menunggu)
```

---

## Event-driven architecture (EDA)

**EDA** adalah gaya arsitektur di mana **event (fakta yang terjadi)** menjadi aliran komunikasi utama antarservice: "pesanan dibuat", "pembayaran diterima", "profil diperbarui". Service menerbitkan event; service lain berlangganan dan bereaksi tanpa saling memanggil langsung.

Keuntungannya: layanan tumbuh atau diperbaiki secara terpisah, satu peristiwa bisa dipakai banyak layanan, dan riwayat peristiwa tetap tersimpan.

**Use case umum Kafka:**

- **Sinkronisasi data** — perubahan dari satu database didistribusikan ke layanan lain secara near real-time.
- **Audit log** — setiap aksi penting dicatat berurutan dan tidak hilang.
- **Notifikasi** — event pesanan memicu surel, push notification, dan SMS oleh service terpisah.
- **Aktivitas pengguna** — klik, view, dan search diolah untuk rekomendasi dan analitik.
- **Integrasi microservices** — satu peristiwa bisnis diketahui semua layanan.

---

## Kafka vs teknologi lain

| Teknologi | Fokus utama | Perlu diketahui |
|-----------|-------------|-----------------|
| **Apache Kafka** | Distributed event streaming & log terdistribusi | Event tersimpan & bisa dibaca ulang banyak pihak |
| **RabbitMQ** | Message broker dengan routing & antrean pesan | Pesan umumnya hilang setelah dikonsumsi; routing sangat fleksibel |
| **Redis Pub/Sub** | Pub/sub ringan dan cepat | Pesan **tidak disimpan** — subscriber offline melewatkan pesan |
| **Database** | Penyimpanan & query data terstruktur | Untuk data yang butuh query, bukan aliran event |

**Jangan menganggap satu teknologi selalu menggantikan yang lain.** Pemilihan bergantung pada pola konsumsi, retensi, routing, dan operasional.

---

## Contoh satu record event

```json
{
  "event_id": "evt-10001",
  "event_type": "order.created",
  "event_version": 1,
  "occurred_at": "2026-11-18T10:00:00Z",
  "data": {
    "order_id": "ORD-1001",
    "user_id": "USR-1001",
    "total": 250000
  }
}
```

- `event_id` → identitas unik, dipakai untuk deduplikasi.
- `event_version` → menjaga kompatibilitas saat schema berubah.
- `occurred_at` → waktu kejadian (bukan waktu pengiriman).

Di tingkat Kafka, satu record juga memiliki **key** (opsional), **value** (payload di atas), **timestamp**, dan **offset** yang diberikan broker. Detailnya di pelajaran berikutnya.

---

## Kesalahan umum pemula

- Menganggap Kafka adalah **database pengganti** — Kafka tidak punya query SQL dan retensinya terbatas.
- Memakai Kafka untuk permintaan yang butuh **jawaban seketika** (cek saldo) — itu pekerjaan HTTP/RPC.
- Mengira Kafka menggantikan RabbitMQ selamanya — untuk pekerjaan satu-pesan-satu-worker, queue tetap lebih sederhana.
- Langsung memakai istilah partition, offset, dan consumer group tanpa memahaminya.

---

## Rangkuman

- **Kafka = distributed event streaming**: producer menulis event ke topic, event disimpan berurutan, consumer membaca kapan saja termasuk replay.
- Tiga masalah utama yang dijawab: **decoupling, pemrosesan asinkron, dan penyeimbangan beban**.
- Sinkron (HTTP) untuk jawaban seketika; **queue untuk pekerjaan**; **streaming untuk mencatat fakta** yang bisa dibaca banyak pihak.
- Kafka bukan pengganti database maupun RabbitMQ — **pilihan teknologi bergantung pada pola konsumsi, retensi, dan routing**.

## Latihan

1. Tulis **3 kalimat** menjelaskan Kafka ke rekan kerja yang belum tahu IT, memakai analogi gudang paket.
2. Sebutkan **tiga masalah** yang dijawab Kafka (decoupling, asinkron, penyeimbangan beban) dengan satu contoh nyata masing-masing.
3. Bandingkan **queue** dan **event streaming** dalam tabel 4 baris: pola, fokus, retensi, contoh teknologi.
4. Kapan kamu akan memilih **RabbitMQ** dan kapan memilih **Kafka**? Tulis satu skenario untuk masing-masing.

## Istilah

| Istilah | Arti |
|--------|------|
| Event / Record | Unit data tunggal yang dikirim ke Kafka |
| Topic | Kategori/nama stream tempat record ditulis |
| Producer | Aplikasi yang menerbitkan record ke Kafka |
| Consumer | Aplikasi yang membaca record dari Kafka |
| Broker | Server Kafka yang menyimpan partition |
| Cluster | Kumpulan broker yang bekerja bersama |
| Event-driven architecture | Arsitektur yang memakai event sebagai komunikasi utama |
| Replay | Membaca ulang event dari posisi awal |

---

**Lanjut → [Pelajaran 2 — Konsep Inti: Topic, Partition, Offset](02-konsep-inti-kafka.md)**
