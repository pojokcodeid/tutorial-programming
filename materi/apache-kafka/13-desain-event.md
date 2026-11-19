# Pelajaran 13 — Desain Event & Schema

> **Durasi:** ± 15 menit
> **Prasyarat:** Pelajaran 1–10

---

## Tujuan belajar

Setelah pelajaran ini kamu bisa:

- Menyusun **envelope event** dengan field wajib.
- Membandingkan **JSON, Avro, dan Protobuf** beserta kapan tepat dipakai.
- Menjelaskan **backward, forward, dan full compatibility**.
- Menjelaskan peran **Schema Registry** dan prinsip versioning.

---

## Envelope event: kerangka konsisten

| Field | Wajib? | Fungsi |
|-------|--------|--------|
| `event_id` | Ya | Identitas unik — deduplikasi & tracing |
| `event_type` | Ya | Jenis peristiwa (`order.created`) |
| `event_version` | Ya | Versi skema payload |
| `occurred_at` | Ya | Waktu kejadian |
| `produced_at` | Saran | Waktu kirim — ukur latensi |
| `source` | Saran | Service asal event |
| `correlation_id` | Saran | Ikatan satu alur bisnis lintas service |
| `data` | Ya | Payload inti peristiwa |

```json
{
  "event_id": "evt-9f3a1c22",
  "event_type": "order.created",
  "event_version": 2,
  "occurred_at": "2026-11-18T10:00:00Z",
  "produced_at": "2026-11-18T10:00:01Z",
  "source": "order-service",
  "correlation_id": "ORD-1001",
  "data": {
    "order_id": "ORD-1001",
    "user_id": "USR-1001",
    "items_count": 3,
    "total": 250000,
    "currency": "IDR"
  }
}
```

- `event_id` → **deduplikasi aman** bila record terbaca dua kali (mis. setelah rebalance).
- `occurred_at` vs `produced_at` → analitik butuh waktu kejadian yang jujur.
- `data` hanya fakta peristiwa — **tanpa data sensitif** (kartu, KTP, token).

---

## JSON vs Avro vs Protobuf

| Aspek | JSON | Avro | Protobuf |
|-------|------|------|----------|
| **Bentuk** | Teks, mudah dibaca | Biner + skema | Biner + skema |
| **Ukuran** | Besar | Kecil | Sangat kecil |
| **Kecepatan** | Sedang | Cepat | Sangat cepat |
| **Evolusi** | Lunak (tanggung jawab kode) | Ketat via registry | Kuat via tag |
| **Cocok untuk** | Event kecil, debug cepat | Pipeline data besar | RPC internal, high volume |

**Aturan praktis:** eksplorasi/MVP → **JSON**; volume besar + evolusi ketat → **Avro/Protobuf + Schema Registry**.

---

## Kompatibilitas: backward, forward, full

- **Backward compatible** — skema baru bisa membaca data lama (tambah field dengan default).
- **Forward compatible** — skema lama bisa membaca data baru.
- **Full compatible** — keduanya terpenuhi; paling lazim untuk production.

**Kuncinya: default value** — field baru wajib default agar konsumen lama tidak crash.

```text
SKEMA v1: { "order_id": string, "total": int }

AMAN
  v2: + "currency": string = "IDR"     ← default: konsumen lama tetap jalan
  v3: + "note": string = ""            ← aman untuk semua pihak

BERBAHAYA
  v2: total:int → total:string          ← tipe berubah: konsumen lama crash
  v2: hapus order_id tanpa default      ← data lama tak terbaca konsumen baru
  v2: rename total → amount tanpa alias ← data lama tak terbaca

ATURAN MAIN
  1. Tambah field → SELALU beri default
  2. Hapus field → hanya bila tak dipakai & ada default
  3. Ubah tipe/nama → pakai event_type baru (order.created.v2)
  4. Validasi otomatis di Schema Registry sebelum deploy
```

---

## Peran Schema Registry

```text
Producer ──▶ Schema Registry (validasi skema + versi id/latest)
                    │
                    ▼
             Topic: order-events (record = skema-id + payload)
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
   Consumer: payment       Consumer: audit (replay)
```

Perubahan skema yang tidak kompatibel **ditolak saat registrasi**, bukan saat consumer error di production.

---

## Prinsip naming & versioning

- **Nama event = kata kerja lampau** — `order.created`, `payment.settled`.
- **Pisahkan perintah vs peristiwa** — `order.create` (perintah) ≠ `order.created` (peristiwa).
- **Versi di nama bila perubahan besar** — `order.created.v2` hidup berdampingan.
- **Topic per bounded context** — `order-events`, bukan satu topic raksasa.
- **Jangan tumpuk field opsional** — semua nullable = sulit dipahami & divalidasi.

---

## Anti-pattern yang mahal

- **Data rahasia di event** — event luas dan panjang umur; sekali bocor sulit ditarik.
- **Skema tanpa versioning** — dua versi muncul, konsumen bingung.
- **Ubah tipe diam-diam** — konsumen lama error di production.
- **Event terlalu besar** — konsumen lambat, memori boros.
- **Satu topic untuk segalanya** — retensi & routing tak bisa disetel.

> 💡 **Mulai:** JSON + envelope wajib. **Naik kelas:** Avro + Schema Registry (FULL) — yang terpenting disiplin **envelope, default, versioning** sejak awal.

---

## Rangkuman

- Envelope wajib: **event_id, event_type, event_version, occurred_at, data**.
- **JSON** untuk kemudahan; **Avro/Protobuf** untuk volume & evolusi ketat.
- **Backward/forward/full** — kuncinya **default value**.
- Nama event kata kerja lampau; perubahan besar = **event_type baru**.

## Latihan

1. Susun envelope `payment.settled` lengkap + jelaskan fungsi tiap field wajib.
2. Mengapa `event_id` dibutuhkan consumer at-least-once?
3. Mana yang backward compatible: tambah field default, ubah tipe, hapus field tanpa default?
4. Bandingkan **JSON vs Avro** (ukuran, kecepatan, evolusi) dalam 3 baris.
5. Strategi rename `total` → `amount` di produksi berjalan?

## Istilah

| Istilah | Arti |
|---------|------|
| Envelope | Pembungkus event: metadata + payload |
| Schema | Definisi bentuk & tipe field event |
| Avro | Format biner + skema (ekosistem data) |
| Protobuf | Format biner ringan (gRPC) |
| Schema Registry | Pusat pendaftaran & validasi skema |
| Backward compatible | Skema baru baca data lama |
| Forward compatible | Skema lama baca data baru |
| Default value | Nilai bawaan penjamin evolusi aman |

---

**Lanjut → [Pelajaran 14 — Delivery Semantics: At-Least/At-Most/Exactly Once](14-delivery-semantics.md)**
