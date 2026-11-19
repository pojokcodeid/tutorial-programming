# Pelajaran 17 — Schema Registry & Evolusi Skema

> **Durasi:** ± 15 menit
> **Prasyarat:** Pelajaran 13 (Desain Event & Schema)

---

## Tujuan belajar

Setelah pelajaran ini kamu bisa:

- Menjelaskan **arsitektur Schema Registry** dan peran **schema id** di record.
- Menjelaskan strategi **penamaan subject**.
- Menerapkan **konfigurasi kompatibilitas** + alur evolusi yang aman.
- **Memeriksa & memecahkan masalah** skema via REST API.

---

## Peran Schema Registry

Registry = layanan terpisah (bukan broker) sebagai **sumber definisi skema tunggal**:

- **Register** — skema baru dicek kompatibilitas terhadap versi sebelumnya.
- **Fetch by id** — record hanya menyimpan **schema id** (4 byte di awal payload); consumer ambil definisinya.
- **Fetch latest** — producer mengambil skema terbaru sebelum menulis.
- **Compatibility check** — aturan evolusi per subject.

```text
Producer ──register + compatibility check──▶ Schema Registry
    │             (subject: order-events-value v3)
    ▼
Topic: order-events   record = [schema id 4 byte] + payload
    │
    ▼
Consumer ──baca id──▶ GET /schemas/ids/{id} ──▶ decode

Kesepakatan: data mengalir di Kafka, makna dikunci di Registry
skema tak terdaftar/tak kompatibel → producer DITOLAK sebelum menulis
```

---

## REST API: periksa & daftarkan

```bash
# daftar subject
curl -s http://localhost:8081/subjects | jq

# riwayat versi & definisi terbaru
curl -s http://localhost:8081/subjects/order-events-value/versions | jq
curl -s http://localhost:8081/subjects/order-events-value/versions/latest | jq

# ambil definisi per id (dipakai consumer decode)
curl -s http://localhost:8081/schemas/ids/7 | jq

# daftarkan skema baru (dicek kompatibilitas)
curl -s -X POST http://localhost:8081/subjects/order-events-value/versions \
  -H 'Content-Type: application/json' \
  -d '{"schema":"{\"type\":\"record\",...}","schemaType":"AVRO"}'

# periksa & ubah kompatibilitas subject
curl -s http://localhost:8081/config/order-events-value | jq
curl -s -X PUT http://localhost:8081/config/order-events-value \
  -H 'Content-Type: application/json' -d '{"compatibility":"BACKWARD"}'
```

- `POST /versions` menolak = perubahan tidak kompatibel → **gerbang pengaman sebelum error di production**.
- `/config` berlaku ke **registrasi berikutnya**, bukan memperbaiki skema lama.

---

## Subject: penamaan menentukan cakupan validasi

| Strategi | Subject dari | Cocok untuk |
|----------|--------------|-------------|
| **TopicNameStrategy** (default) | nama topic: `order-events-value` | satu skema per topic |
| **RecordNameStrategy** | nama record: `OrderCreated` | banyak tipe per topic |
| **TopicRecordNameStrategy** | topic + nama record | fleksibel, tetap terisolasi |

Pilihan ini menentukan **seberapa longgar validasi**: banyak tipe dalam satu topic + TopicNameStrategy = satu riwayat gabungan.

---

## Kompatibilitas dalam praktik

- **BACKWARD** (default umum) — skema baru harus baca data lama → field baru wajib **default**.
- **FORWARD** — skema lama harus baca data baru.
- **FULL** — keduanya; paling ketat & aman untuk production.
- **NONE** — tanpa pemeriksaan; hanya eksperimen.

**Alur aman:** tambah field dengan default → registrasi → deploy consumer (bila perlu) → deploy producer. Perubahan besar (tipe/nama) → **subject/event_type baru**, jalankan berdampingan, lalu pensiunkan lama.

```text
v1: {order_id: string, total: int}

v2 DITERIMA (backward: default ada):
    + {name:"currency", type:"string", default:"IDR"}

v3 DITOLAK (tipe berubah — data lama tak terbaca):
    total: int → string

v3 ALTERNATIF: tambah field baru total_v2 + konversi (total dibiarkan)

ATURAN CEPAT
  + field dengan default  → aman
  - field lama            → hati-hati (FULL & tak dipakai)
  ubah tipe / rename      → subject atau event_type baru
```

---

## Saat terjadi kegagalan skema

- **Skema tak terdaftar** — producer gagal; periksa koneksi & izin (setelan `auto.register.schemas`).
- **Id tidak ditemukan** saat decode — registry beda environment, data dipindah tanpa skema, atau registry dibersihkan.
- **Consumer tak bisa baca data baru** — tak kompatibel (cek `latest.compatibility.strict`).
- **Registry down** — koneksi dibuka awal; skema baru saat runtime bisa gagal → siapkan **cache lokal** + registry HA.

---

## Kesalahan tim baru

- **`auto.register.schemas=true` di production** — perubahan tak terkontrol lolos dari kode siapa pun → matikan, daftarkan via CI/CD.
- **Menghapus lalu membuat ulang subject** — id lama bisa tak konsisten.
- **Lupa default pada field baru** — registrasi ditolak / konsumen lama gagal baca.
- **Satu registry semua environment** — dev/staging/prod saling menimpa.
- **Menganggap registry penyimpanan data** — registry menyimpan **definisi**, record tetap di log Kafka.

> 💡 **Checklist adopsi:** (1) pilih Avro/Protobuf, (2) mulai `TopicNameStrategy`, (3) set **BACKWARD/FULL** semua subject, (4) matikan auto-register di production + CI check, (5) alert registrasi gagal & decode error.

---

## Rangkuman

- Registry = **definisi terpusat**; record hanya bawa **schema id**.
- Validasi **saat registrasi** — skema buruk ditolak lebih dulu.
- **Subject** = cakupan riwayat; **kompatibilitas** = aturan evolusi.
- Production: **tanpa auto-register**, daftar via CI, siapkan alert.

## Latihan

1. Uraikan perjalanan **schema id** dari producer sampai consumer paham payload.
2. Bandingkan **TopicNameStrategy** vs **RecordNameStrategy**.
3. Daftarkan v2 (field + default) via REST; lalu coba ubah tipe — catat hasilnya.
4. Mengapa `auto.register.schemas=true` berisiko di production?
5. Tiga kemungkinan penyebab **"id tidak ditemukan"**.

## Istilah

| Istilah | Arti |
|---------|------|
| Schema Registry | Pusat definisi & validasi skema |
| Schema id | 4 byte penunjuk definisi di registry |
| Subject | Riwayat skema per topic/record |
| TopicNameStrategy | Subject dari nama topic (default) |
| RecordNameStrategy | Subject dari nama record |
| BACKWARD/FORWARD/FULL | Tingkat kompatibilitas |
| auto.register.schemas | Registrasi otomatis (mati di prod) |
| Schema evolution | Evolusi skema kompatibel antarversi |

---

**Lanjut → [Pelajaran 18 — Kafka Connect & CDC](18-kafka-connect-cdc.md)**
