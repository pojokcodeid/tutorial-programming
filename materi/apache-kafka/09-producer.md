# Pelajaran 9 — Producer: Key, Batching & Acks

> **Durasi:** ± 15 menit
> **Prasyarat:** Pelajaran 5–8

---

## Tujuan belajar

Setelah pelajaran ini kamu bisa:

- Menguraikan **alur pengiriman record** dari producer hingga broker.
- Menjelaskan cara kerja **accumulator** dan pengaruh `batch.size` serta `linger.ms`.
- Memilih **acks** yang tepat sesuai kebutuhan kepastian.
- Menjelaskan **retries, enable.idempotence**, dan penanganan record gagal via callback.

---

## Alur pengiriman record

Saat memanggil `send()`, record melewati:

1. **Serialize** — key/value → byte (StringSerializer, JsonSerializer, dll).
2. **Partitioner** — tentukan tujuan: `hash(key) % N`; tanpa key → sticky.
3. **Accumulator** — record dikumpulkan per partition jadi **batch**.
4. **Sender thread / IO** — batch penuh atau `linger.ms` habis → kirim ke broker leader.
5. **Acknowledgement** — broker konfirmasi sesuai `acks`; gagal → **retries**.

> **Kunci:** producer mengirim **dalam batch, bukan per record** — asal-usul pengaturan throughput & latensi.

```text
send() ──▶ Serializer ──▶ Partitioner ──▶ Accumulator (per partition)
   key+value    byte         hash(key)%N         │
                                                 ▼
                              Batch: penuh (batch.size) ATAU linger.ms habis
                                                 │
                                                 ▼
                                    Broker (leader) menulis ke partition
                                                 │
                                                 ▼
                          Ack: acks=0 | 1 | all → gagal? retries → callback error
```

---

## Batching: batch.size & linger.ms

| Konfigurasi | Default | Fungsi |
|-------------|---------|--------|
| `batch.size` | 16384 (16 KB) | Ukuran maks batch per partition — penuh → kirim |
| `linger.ms` | 0 | Waktu tunggu sebelum kirim walau belum penuh |

- **`linger.ms = 0`** — kirim segera → **latensi rendah**, batch kecil → throughput lebih rendah.
- **`linger.ms 5–50 ms** — menunggu → batch besar → **throughput naik**, latensi sedikit bertambah.

```java
Properties props = new Properties();
props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class.getName());

// --- mode HIGH THROUGHPUT ---
props.put(ProducerConfig.LINGER_MS_CONFIG, "20");
props.put(ProducerConfig.BATCH_SIZE_CONFIG, "65536");         // 64 KB
props.put(ProducerConfig.COMPRESSION_TYPE_CONFIG, "lz4");
props.put(ProducerConfig.BUFFER_MEMORY_CONFIG, "33554432");   // 32 MB

// --- mode LOW LATENCY (alternatif) ---
// props.put(ProducerConfig.LINGER_MS_CONFIG, "0");
// props.put(ProducerConfig.BATCH_SIZE_CONFIG, "16384");
// props.put(ProducerConfig.COMPRESSION_TYPE_CONFIG, "none");

// --- kepastian & keamanan ---
props.put(ProducerConfig.ACKS_CONFIG, "all");
props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, "true");
props.put(ProducerConfig.RETRIES_CONFIG, "10");
props.put(ProducerConfig.RETRY_BACKOFF_MS_CONFIG, "100");
```

---

## Acks

| acks | Konfirmasi | Risiko | Latensi |
|------|-----------|--------|---------|
| `0` | Tidak ada | Hilang tanpa kabar | Terendah |
| `1` | Leader | Hilang saat leader mati | Sedang |
| `all` | Seluruh ISR (min.isr) | Tulis gagal saat ISR menyusut | Tertinggi |

Untuk data bisnis (order, pembayaran) → **pakai `acks=all`**. `acks=0` hanya untuk metrik non-kritis.

---

## Retries dan idempotence

Gagal (broker pindah leadership, jaringan sesaat) → producer **retry** dengan backoff. Retry bisa membuat record **dobel** atau **tidak berurutan**.

**`enable.idempotence=true`** memberi **sequence number** per batch per partition — broker menolak duplikat & menjaga urutan, walau ada retry.

- Idempotence aktif → `acks` otomatis `all`, retries maksimal, `max.in.flight` maksimal 5.
- Butuh urutan persis → `max.in.flight.requests.per.connection=1` (latensi naik sedikit).

```java
producer.send(record, (metadata, exception) -> {
    if (exception != null) {
        log.error("gagal kirim ke {}-{} : {}",
            record.topic(), record.partition(), exception.getMessage());
        simpanKeDeadLetter(record, exception);   // topic DLT / penyimpanan lokal
        return;
    }
    log.debug("ok {}-{} @{}", metadata.topic(), metadata.partition(), metadata.offset());
});

producer.flush();    // pastikan seluruh antrean terkirim
producer.close();
```

- **Callback = satu-satunya cara** tahu record sampai atau tidak.
- Kebijakan umum: retry internal → bila tetap gagal, **simpan ke dead-letter** lalu monitor.
- **`flush()` sebelum `close()`** — tanpanya, exit bisa membawa data yang belum terkirim.

---

## Kesalahan producer yang sering terjadi

- **Mengabaikan callback** — error tak terlihat sampai data hilang diketahui.
- **`acks=1` untuk data kritis** — satu kegagalan leader = data raib.
- **Serializer salah** — error sering muncul di consumer, bukan producer.
- **Retries tinggi tanpa idempotence** — duplikat & reorder.
- **`flush()` tak pernah dipanggil** — shutdown mendadak = antrean lenyap.
- **Satu producer lintas topik tanpa key jelas** — pemetaan partition tak terkontrol.

> 💡 **Ukur, jangan menebak:** naikkan `linger.ms` 0 → 5 → 20 → 50, catat throughput & latensi p95/p99, hentikan saat throughput berhenti naik.

---

## Rangkuman

- Alur: **serialize → partitioner → accumulator (batch) → kirim → ack/retry**.
- **`batch.size` + `linger.ms`** menyeimbangkan **throughput vs latensi**; kompresi memperbesar manfaat batch besar.
- **`acks=0/1/all`** sesuai kebutuhan kepastian — data bisnis: `acks=all`.
- **Retries + idempotence** anti duplikat; **callback + flush** anti hilang diam-diam.

## Latihan

1. Urutkan **5 tahap** perjalanan record dari `send()` hingga acknowledgement.
2. Jelaskan hubungan `batch.size` dan `linger.ms`; apa efek menaikkan linger?
3. Kapan `acks=all` wajib dan kapan `acks=0` masih dibenarkan?
4. Mengapa `enable.idempotence=true` mengurangi duplikat saat retry?
5. Praktikkan callback: hentikan broker saat producer mengirim, amati errornya.

## Istilah

| Istilah | Arti |
|---------|------|
| Serializer | Key/value → byte |
| Partitioner | Penentu partition tujuan |
| Accumulator | Penampung batch per partition |
| batch.size | Ukuran maks batch (byte) |
| linger.ms | Waktu tunggu sebelum kirim |
| acks | Tingkat kepastian konfirmasi tulis |
| Idempotence | Retry tanpa duplikat |
| max.in.flight | Jumlah request tanpa menunggu jawaban |

---

**Lanjut → [Pelajaran 10 — Consumer: Membaca & Memproses Data](10-consumer.md)**
