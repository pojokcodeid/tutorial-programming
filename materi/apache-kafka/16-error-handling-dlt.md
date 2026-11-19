# Pelajaran 16 — Error Handling, Retry & Dead Letter Topic

> **Durasi:** ± 15 menit
> **Prasyarat:** Pelajaran 13–15

---

## Tujuan belajar

Setelah pelajaran ini kamu bisa:

- Mengklasifikasi kegagalan: **transient vs non-retryable**.
- Menerapkan **backoff eksponensial + jitter** dengan batas retry yang wajar.
- Menguraikan alur **retry topic → Dead Letter Topic** beserta metadata error.
- Merancang **replay manual dan alerting** untuk pesan di DLT.

---

## Kegagalan itu pasti — yang penting bagaimana

| Jenis kegagalan | Contoh | Kategori |
|-----------------|--------|----------|
| Broker down | leadership pindah, ISR mengecil | **transient** |
| Network timeout | koneksi client–broker putus sesaat | **transient** |
| Serialization error | deserializer tak paham bytes | non-retryable |
| Payload invalid | JSON rusak, field wajib kosong | non-retryable |
| Validasi bisnis gagal | saldo kurang, stok habis | non-retryable |
| DB/API tujuan mati | PostgreSQL maintenance, API 503 | **transient** |
| Consumer crash | proses mati → rebalance | **transient** |
| Duplicate event | terproses dua kali setelah retry | **idempotency** |
| Poison message | selalu membuat crash | non-retryable |

> **Aturan praktis:** kondisi **di luar aplikasi** (jaringan, broker, DB) → transient, layak ulang. **Isi pesan** bermasalah → langsung ke DLT.

---

## Alur pesan gagal: retry topic → DLT

**Dead Letter Topic (DLT)** = topic khusus untuk pesan yang sudah menyerah, lengkap dengan keterangan kenapa gagal. Pesan tetap tersimpan → bisa diperiksa, diperbaiki, **di-replay**.

```text
[Topic Utama] ──▶ [Consumer: proses & gagal, maks 5x] ──▶ [Retry Topic] ──▶ [Dead Letter]
  order-events         coba lagi / lempar retry           order-events.retry   order-events.dlt
                     backoff eksponensial                  + alerting

Setelah batas habis: pesan + metadata error → DLT → diperbaiki & di-replay
(perhatikan: urutan bisa berubah setelah melewati retry topic)
```

---

## Retry langsung vs backoff + jitter

**Retry langsung** → *hot loop*: satu pesan diulang ribuan kali/menit, membanjiri log, membebani service yang sudah sakit, offset tak maju.

```text
BASIS 1 dtk, multiplier 2, maks 60 dtk, jitter 0–500 ms, batas 5 percobaan

percobaan   jeda sebelumnya   keterangan
    1             -           langsung diproses
    2           1 dtk         1 × 2^0 = 1s + jitter
    3           2 dtk         1 × 2^1 = 2s + jitter
    4           4 dtk         1 × 2^2 = 4s + jitter
    5           8 dtk         1 × 2^3 = 8s + jitter
  masih gagal    -            kirim ke order-events.dlt + alert

RETRY LANGSUNG                    BACKOFF + JITTER + BATAS
1.000 pesan gagal = 1.000        percobaan menyebar, target sempat pulih;
hantaman serentak ke target      setelah 5× tetap gagal → DLT
yang makin down
```

- **Backoff eksponensial** — jeda berlipat (1, 2, 4, 8 detik) memberi waktu pulih.
- **Jitter** — acakan ratusan ms mencegah *thundering herd*.
- **Batas percobaan** — jelas, lalu ke DLT.

---

## Konfigurasi penanganan error (contoh)

```json
{
  "consumer": {
    "topic": "order-events",
    "group.id": "payment-service",
    "enable.auto.commit": "false",
    "max.poll.records": 100
  },
  "retry": {
    "topic": "order-events.retry",
    "maxAttempts": 5,
    "backoff": { "initialMs": 1000, "multiplier": 2.0, "maxMs": 60000, "jitterMs": 500 },
    "nonRetryable": ["SerializationException", "InvalidPayloadException", "BusinessRuleException"]
  },
  "dlt": {
    "topic": "order-events.dlt",
    "headers": ["dlt-exception-class", "dlt-exception-message",
                "dlt-original-topic", "dlt-original-timestamp", "dlt-attempts"]
  },
  "alerting": { "channel": "#ops-alerts", "warnIfDepth": 10, "pageIfDepth": 100 }
}
```

- `nonRetryable` → langsung DLT tanpa pemborosan waktu.
- `dlt.headers` → **metadata error**: kelas exception, pesan, topic asal, timestamp, jumlah percobaan.
- `enable.auto.commit: false` → offset maju hanya setelah proses/penguburan tuntas.
- `alerting` → DLT berubah dari tempat sampah jadi sistem peringatan.

---

## Metadata error, replay manual, dan alerting

Setiap pesan di DLT wajib membawa:

- **Topic asal** — agar replay mengembalikan ke tempat yang benar.
- **Exception (kelas & pesan)** — penyebab, langsung bisa dicari.
- **Timestamp** — kapan kejadian, untuk mengukur lamanya masalah.
- **Jumlah percobaan & consumer** — berapa kali diulang dan siapa yang menyerah.
- **Payload asli utuh** — badan pesan tidak boleh dibuang.

**Replay terkendali:** perbaiki penyebab → kirim ulang dari DLT ke topic asal → konsumen **idempoten** menangani kemungkinan duplikat → tandai/arsipkan baris yang sudah di-replay.

---

## Poison message & pesan menggantung

- **Jangan retry tanpa batas** — memblokir consumer & seluruh partition di belakangnya.
- **Jangan commit sebelum selesai** — pesan hilang (at-least-once gagal).
- **Jangan menghapus payload di DLT** — metadata boleh ditambah, badan pesan wajib utuh.
- **Jangan menganggap urutan utuh** setelah retry topic — andalkan **idempotency**, bukan asumsi urutan.

> 💡 **Mulai sederhana:** cukup `order-events` + `order-events.dlt` dengan retry in-process berbatas (3× backoff). Tambah **retry topic** hanya bila ada dependency lambat yang sering tersendat.

---

## Rangkuman

- **Transient** (broker/jaringan/DB) → di-retry; **non-retryable** (payload/bisnis) → langsung DLT.
- **Backoff eksponensial + jitter + batas** menghindari hot loop & thundering herd.
- **Retry topic** memindahkan kerja ulang ke antrean terpisah → **urutan bisa berubah, wajib idempoten**.
- **DLT** menyimpan payload utuh + metadata → diagnosis, perbaikan, replay terkendali, alerting.

## Latihan

1. Kelompokkan 8 kegagalan ini ke **transient** vs **non-retryable**: disk broker penuh, JSON invalid, timeout PostgreSQL, saldo kurang, deserializer gagal, API shipping 503, duplikat event, payload terpotong.
2. Hitung jadwal backoff: basis 2 detik, multiplier 2, maks 30 detik, batas 6 percobaan — kapan pesan dikirim ke DLT?
3. Susun **daftar header DLT** untuk sistem payment + langkah replay beserta risiko duplikasi.
4. Mengapa urutan bisa berubah setelah melewati retry topic? Solusinya apa?
5. Berapa ambang `warnIfDepth`/`pageIfDepth` yang wajar untuk sistem barumu? Mengapa?

## Istilah

| Istilah | Arti |
|---------|------|
| Transient failure | Kegagalan sementara (luar aplikasi) — layak ulang |
| Non-retryable error | Kegagalan permanen — langsung DLT |
| Backoff eksponensial | Jeda berlipat tiap percobaan |
| Jitter | Acakan jeda anti thundering herd |
| Retry topic | Topic terpisah untuk percobaan ulang |
| Dead Letter Topic | Tujuan akhir pesan menyerah + metadata |
| Poison message | Pesan yang selalu membuat crash |
| Replay | Memutar ulang pesan DLT ke topic asal |

---

**Lanjut → [Pelajaran 17 — Schema Registry & Evolusi Skema](17-schema-registry.md)**
