# Pelajaran 12 — Integrasi & Event-Driven Architecture

> **Durasi:** ± 15 menit
> **Prasyarat:** Pelajaran 1–11

---

## Tujuan belajar

Setelah pelajaran ini kamu bisa:

- Menjelaskan **empat pola integrasi** berbasis event.
- Membandingkan **choreography vs orchestration**.
- Menguraikan **skenario integrasi microservices** end-to-end dengan Kafka.
- Mengenali **anti-pattern** integrasi event-driven.

---

## Empat pola integrasi berbasis event

| Pola | Inti | Cocok untuk |
|------|------|-------------|
| **Event notification** | Event = "ada yang terjadi", payload ringkas | Sinkronisasi, notifikasi, trigger |
| **Event-carried state transfer** | Event membawa **salinan data** lengkap | Kurangi RPC antarlayanan |
| **Event sourcing** | Database = **urutan event**; state = rekayasa ulang | Audit lengkap, keuangan |
| **CQRS** | **Model tulis ≠ model baca** (projection dari event) | Baca jauh lebih berat dari tulis |

Empat pola sering dipakai bersama: pesanan memakai state transfer untuk konsumen ringan, laporan memakai CQRS dari event sourcing.

```text
order-service ──▶ ┌─ Topic: order-events ─┐ ──▶ notification-service (kirim surel)
tulis + produce    │ order.created (ringkas)│ ──▶ analytics-service (projection/CQRS)
                   │ order.paid             │ ──▶ audit-service (riwayat)
                   └────────────────────────┘
        satu peristiwa, banyak pembaca — tanpa saling memanggil
```

---

## Notification vs state transfer

```json
NOTIFICATION (ringkas — penerima tarik data sendiri)
{
  "event_type": "order.created",
  "event_id": "evt-10001",
  "occurred_at": "2026-11-18T10:00:00Z",
  "data": { "order_id": "ORD-1001" }
}

STATE TRANSFER (payload mandiri)
{
  "event_type": "order.created",
  "event_id": "evt-10001",
  "data": {
    "order_id": "ORD-1001",
    "user_email": "andi@example.id",
    "items": [{ "sku": "SKU-1", "qty": 2, "price": 125000 }],
    "total": 250000, "currency": "IDR"
  }
}
```

- **Notification** hemat & selalu segar, tapi penerima harus memanggil service asal.
- **State transfer** membuat penerima mandiri — trade-off: payload lebih besar & bisa kedaluwarsa.
- Kombinasi lazim: **ringkas untuk trigger, lengkap untuk data yang sering dibutuhkan**.

---

## Choreography vs orchestration

- **Choreography** — tanpa pusat; tiap layanan mendengar event & bereaksi. Longgar, tapi alur sulit dilacak.
- **Orchestration** — koordinator pusat memerintahkan langkah demi langkah. Jelas & terawasi, tapi jadi titik kompleksitas.

> Aturan praktis: **choreography untuk 2–3 layanan; orchestration/saga untuk alur panjang dengan banyak pengecualian.**

```text
SINKRON LAMA (tightly-coupled)
POST /orders → order-service → panggil payment → inventory → notification
  gagal di langkah 3 = kompensasi manual

EVENT-DRIVEN (choreography)
Client → order-service: simpan + produce order.created
  payment-service   ──dengar order.created──▶ bayar → produce order.paid
  inventory-service ──dengar order.paid─────▶ kurangi stok
  notification      ──dengar order.paid─────▶ kirim surel

YANG BERUBAH
  • order-service tak perlu tahu siapa penerima
  • kegagalan satu penerima tidak menahan pengirim
  • layanan baru tinggal subscribe
```

Waspadai: alur berbelit membuat pertanyaan *"kenapa belum bayar?"* sulit dilacak → tambah `correlation_id` + audit trail, atau pindah ke saga.

---

## Skenario end-to-end

1. **order-service** — simpan ke DB → produce `order.created` (state transfer).
2. **payment-service** — proses bayar → produce `order.paid`.
3. **inventory-service** — reaksi `order.paid` → pangkas stok (idempoten).
4. **notification-service** — kirim surel/push pada `order.paid`.
5. **analytics-service** — bangun projection penjualan/jam (CQRS read).
6. **audit-service** — simpan seluruh event.

Tiap layanan punya **`group.id` sendiri** → semua membaca penuh tanpa berebut (fan-out).

---

## Anti-pattern integrasi

- **Event sebagai RPC tersembunyi** (butuh balasan → pakai RPC biasa).
- **Terlalu banyak topic tanpa aturan** — satu topic per domain, penamaan `entity.verb`.
- **Choreography tanpa batas** — alur 8 langkah tanpa orkestrator = debugging mimpi buruk.
- **Event membawa data rahasia**.
- **Consumer tanpa idempotensi** — duplikat itu pasti.

> ⚠️ **Kafka BUKAN pilihan saat:** butuh balasan seketika (→ HTTP/RPC), alur sangat sederhana (→ RabbitMQ/SQS), data sekali pakai tanpa riwayat, atau tim belum siap operasional.

> 💡 **Aturan cepat:** (1) Butuh balasan? → RPC. (2) Butuh banyak pembaca/riwayat? → Kafka. (3) Alur berbelit + pengecualian? → saga; sederhana → choreography.

---

## Rangkuman

- Pola: **notification, state transfer, event sourcing, CQRS** — sering dipakai bersama.
- **Choreography** untuk alur pendek; **orchestration/saga** untuk alur berbelit.
- Kafka: **satu peristiwa, banyak pembaca** dengan `group.id` masing-masing.
- Hindari: **event sebagai RPC, topic acak, choreography tanpa batas, data rahasia, tanpa idempotensi**.

## Latihan

1. Bedakan **notification** vs **state transfer** dengan contoh masing-masing.
2. Mengapa fan-out Kafka melayani banyak layanan, sedangkan queue tidak?
3. Bandingkan **choreography vs orchestration** — kapan masing-masing menang?
4. Pada skenario end-to-end, `group.id` apa untuk tiap layanan? Mengapa tak dipakai bersama?
5. Sebutkan **3 anti-pattern** integrasi event-driven + akibatnya.

## Istilah

| Istilah | Arti |
|---------|------|
| Event-driven architecture | Event sebagai alur komunikasi utama |
| Event notification | Event ringkas sebagai pemberitahuan |
| Event-carried state transfer | Event membawa salinan data |
| Event sourcing | Riwayat event sebagai sumber kebenaran |
| CQRS | Model tulis & baca terpisah |
| Choreography | Koordinasi tanpa pusat |
| Orchestration | Koordinator pusat alur bisnis |
| Saga | Transaksi lintas layanan + kompensasi |

---

**Lanjut → [Pelajaran 13 — Desain Event & Schema](13-desain-event.md)**
