# Pelajaran 15 — Transactional Outbox Pattern

> **Durasi:** ± 15 menit
> **Prasyarat:** Pelajaran 12–14

---

## Tujuan belajar

Setelah pelajaran ini kamu bisa:

- Menjelaskan **dual-write problem**.
- Menguraikan langkah **transactional outbox**: satu transaksi lalu distribusi.
- Membandingkan distribusi via **CDC (Debezium)** vs **polling relay**.
- Menimbang **alternatif** dan kapan outbox tidak wajib.

---

## Dual-write problem

Satu aksi bisnis harus (a) mengubah database dan (b) mengirim event — dua sistem yang **tidak bisa dicakup transaksi sama**:

- **DB sukses, Kafka gagal** — data tersimpan, tidak ada yang tahu → layanan lain ketinggalan.
- **Kafka sukses, DB gagal** — event beredar tanpa perubahan nyata → informasi palsu.

Urutan mana pun tetap meninggalkan celah. Inilah alasan outbox lahir.

```text
order-service ──▶ ┌── Database (satu transaksi) ─────────────┐
                  │ INSERT orders (ORD-1001)                 │
                  │ INSERT outbox (event order.created)      │  ← atomik
                  └──────────────────┬───────────────────────┘
                                     ▼
                  Relay: CDC Debezium ATAU poll → baca outbox → produce
                                     │
                                     ▼
                                   Kafka  order.created
gagal di relay? baris outbox tetap ada → dicoba lagi (at-least-once, idempoten)
```

---

## Langkah transactional outbox

1. **Tulis dalam satu transaksi** — `INSERT` tabel bisnis **dan** `INSERT` tabel `outbox` bersama-sama.
2. **Commit** — keduanya berhasil bersama atau batal bersama.
3. **Distribusikan** — relay/CDC membaca outbox dan **produce** ke Kafka.
4. **Tandai** — setelah terkonfirmasi terkirim, baris ditandai (`published_at`).

**Tidak ada lagi dual-write di lapisan aplikasi** — Kafka jadi konsekuensi dari perubahan DB.

```sql
-- TABEL OUTBOX
CREATE TABLE outbox (
  id            BIGSERIAL PRIMARY KEY,
  aggregate_id  VARCHAR(64)  NOT NULL,
  event_type    VARCHAR(64)  NOT NULL,
  payload       JSONB        NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  published_at  TIMESTAMPTZ             -- NULL = belum terkirim
);

-- SATU transaksi: bisnis + outbox atomik
BEGIN;
  INSERT INTO orders (id, user_id, total) VALUES ('ORD-1001', 'USR-1001', 250000);
  INSERT INTO outbox (aggregate_id, event_type, payload)
  VALUES ('ORD-1001', 'order.created', '{"order_id":"ORD-1001","total":250000}');
COMMIT;

-- RELAY (polling): kirim yang belum terkirim, lalu tandai
SELECT id, event_type, payload FROM outbox
WHERE published_at IS NULL ORDER BY id LIMIT 100;
UPDATE outbox SET published_at = now() WHERE id = ANY(:ids);
```

- `published_at IS NULL` = daftar tugas → kegagalan **dipulihkan otomatis**.
- Relay **setidaknya sekali** → consumer **wajib idempoten** (`event_id`).
- Alternatif polling: **CDC/Debezium** membaca WAL database secara streaming.

---

## CDC (Debezium) vs polling relay

| Aspek | CDC / Debezium | Polling relay |
|-------|----------------|---------------|
| **Cara kerja** | Baca log perubahan (WAL) streaming | Query periodik tabel outbox |
| **Latensi** | Sangat rendah | Tergantung interval |
| **Beban DB** | Rendah (baca log) | Query berulang (butuh index) |
| **Kompleksitas** | Kafka Connect + connector | Kode aplikasi biasa |
| **Cocok untuk** | Produksi volume besar | Proyek kecil, detik oke |

```java
@Transactional   // satu transaksi dengan operasi bisnis
public void createOrder(CreateOrderCommand cmd) {
    Order order = Order.create(cmd);
    orderRepository.save(order);                 // 1) perubahan bisnis
    outboxRepository.save(OutboxEvent.of(        // 2) catatan event, atomik
        order.getId(), "order.created",
        mapper.writeValueAsString(order.toEventData())));
}
// pengiriman ditangani relay/connector — aplikasi tak memanggil Kafka
```

---

## Alternatif & kapan outbox tidak wajib

- **Dual write apa adanya** — paling sederhana, celah kegagalan tetap ada; perlu rekonsiliasi.
- **Dua transaksi + retry** — lebih baik, masih bisa duplikat/gagal di tengah.
- **Event dua fase** — event `pending` di DB → kirim → tandai (mirip outbox tanpa tabel terpisah).
- **Transactional produce Kafka** — menyelesaikan sisi Kafka, **tidak mencakup DB** → celah tetap.

**Wajib outbox saat:** event berdampak bisnis (pembayaran, stok), kegagalan parsial tak ditoleransi, tanpa rekonsiliasi manual. Log non-kritis: dual write + monitoring sering cukup.

---

## Jebakan implementasi

- **Tanpa index `published_at`** — polling melambat saat data menumpuk.
- **Menghapus baris terlalu dini** — produce sukses tapi update gagal = hilang tanpa terkirim; **tandai dulu**, arsipkan berkala.
- **Lupa urutan** — relay harus menurut urutan per aggregate.
- **Relay single point tanpa pengawasan** — pantau **umur baris belum terkirim** sebagai metrik.
- **Mengira outbox menggantikan idempotensi** — pengiriman tetap at-least-once.

> 💡 **Mulai ringan:** polling relay + index + `published_at`. Latensi mulai ketat/volume besar → naik ke **Kafka Connect + Debezium** tanpa mengubah struktur outbox.

---

## Rangkuman

- **Dual-write problem** — tulis DB & Kafka terpisah selalu meninggalkan celah.
- **Outbox**: perubahan bisnis + baris outbox dalam **satu transaksi**, lalu relay distribusikan.
- Distribusi: **polling relay** (sederhana) atau **CDC/Debezium** (near real-time).
- Relay **at-least-once** → consumer idempoten; pantau umur baris belum terkirim.

## Latihan

1. Jelaskan **dual-write problem** dengan dua skenario kegagalannya.
2. Urutkan **4 langkah outbox** + di mana atomisitas tercapai.
3. Bandingkan **CDC vs polling** (latensi, beban DB, kompleksitas).
4. Mengapa consumer tetap idempoten setelah outbox?
5. Notifikasi internal non-kritis — outbox wajib? Beri alasan.

## Istilah

| Istilah | Arti |
|---------|------|
| Dual-write problem | Menulis DB + Kafka tanpa jaminan kebersamaan |
| Transactional outbox | Data & event atomik dalam satu transaksi DB |
| Tabel outbox | Penampung event menunggu distribusi |
| Relay | Pembaca outbox → produce Kafka |
| CDC | Change Data Capture dari log database |
| Debezium | Platform CDC untuk Kafka Connect |
| published_at | Penanda sudah/k belum terkirim |
| At-least-once relay | Boleh kirim ulang; konsumen idempoten |

---

**Lanjut → [Pelajaran 16 — Error Handling & Dead Letter Topic](16-error-handling-dlt.md)**
