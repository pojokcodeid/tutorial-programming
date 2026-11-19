# Pelajaran 25 — Proyek Akhir: Pipeline Pesanan End-to-End

> **Durasi:** ± 20 menit
> **Prasyarat:** Seluruh Pelajaran 1–24

---

## Tujuan belajar

Setelah pelajaran ini kamu bisa:

- Merancang **topik, key, partition, konfigurasi** pipeline pesanan.
- Mengimplementasikan **producer & consumer** dengan outbox, DLT, idempotensi.
- Memasang **monitoring, alerting, pemulihan**.
- Menilai kesiapan **produksi** lewat checklist & pemeriksaan mandiri.

---

## Rancangan sistem

- **order-service** — HTTP → DB + **outbox** (satu transaksi) → relay produce.
- **payment-service** — `order.paid` / `payment.failed`.
- **inventory-service** — pangkas stok pada `order.paid` (idempoten, key = order_id).
- **notification-service** — surel/push.
- **analytics-service** — projection penjualan per jam (CQRS).
- **audit-service** — seluruh peristiwa (retensi panjang).

```text
Client/HTTP ──POST /orders──▶ order-service (DB + outbox 1 tx)
                                   │ relay/CDC → produce
                                   ▼
                        ┌─ Kafka topics ──────────────────┐
                        │ order-events  (key=order_id,RF=3)│
                        │ payment-events / stock-events    │
                        │ order-events.dlt                 │
                        └───────┬──────────┬───────────────┘
                                ▼          ▼
        payment-service      inventory-service     notification · analytics
        (group=payment)      (group=inventory)     (group sendiri)

Monitoring: lag per group · under-replicated · DLT depth · p99 produce/fetch
alert: lag > ambang 10 mnt · disk > 85% · DLT > 0
```

---

## Keputusan rancangan & alasannya

| Keputusan | Pilihan | Alasan |
|-----------|---------|--------|
| key `order-events` | `order_id` | 1 pesanan berurutan di 1 partisi |
| partisi | 12 | kelipatan consumer (6–8 aktif) |
| replication factor | 3 | toleransi 1 broker mati (min.insync=2) |
| acks | all + idempotence | tak ada acknowledged write hilang |
| retensi | 30 hari | audit + replay sebulan |
| format | Avro + Registry | evolusi terkontrol (BACKWARD) |
| commit | manual | hanya setelah proses tuntas |
| DB + event | **outbox** | tanpa dual-write |
| error | retry berbatas → DLT | transient diulang, permanen dikubur |
| consumer | idempoten (`event_id`) | at-least-once tetap aman |
| monitoring | lag/group + DLT | deteksi dini |

```text
TOPIK
  order-events        RF 3 · 12 partisi · key order_id · retensi 30 hari
  payment-events      RF 3 · 6 partisi  · key payment_id
  stock-events        RF 3 · 6 partisi  · key sku
  order-events.retry  2 partisi · retensi 3 hari
  order-events.dlt    2 partisi · retensi 30 hari
  sales-per-hour      RF 3 · 6 partisi (hasil agregasi)
```

- Key `order_id` → urutan per pesanan konsisten; **mengubahnya = berpindah partisi**.
- Partisi = **kelipatan** consumer agar beban rata.

---

## Producer, consumer, penanganan error

```text
PRODUCER (setelah transaksi outbox commit)
  send(key=order_id, value={event_id, event_type, occurred_at, data},
       headers=correlation_id) — acks=all, idempotence=true

CONSUMER (payment-service)
  loop:
    records = poll(100 ms)
    for record in records:
      if already_processed(correlation_id):   # IDEMPOTEN
        commit; continue
      try:
        process(record); save_processed(...)  # satu transaksi
        commit
      except TransientError:                  # jaringan / DB mati
        if attempts < 5: retry backoff (1,2,4,8s + jitter)
        else: send_to_dlt; commit
      except PermanentError:                  # payload rusak / bisnis
        send_to_dlt; commit

DLT HEADER: dlt-exception-class, dlt-original-topic,
            dlt-attempts, dlt-correlation-id

ANALYTICS (Kafka Streams / ksqlDB)
  order-events.filter(PAID).groupBy(user_id, window 1 jam)
    .aggregate(total) → sales-per-hour
```

Gabungan pelajaran 10, 15, 16: **commit setelah tuntas**, **idempoten**, **retry berbatas** (transient), **DLT** (permanen).

---

## Monitoring & prosedur pemulihan

Dashboard wajib: **lag per group · under-replicated (0) · kedalaman DLT · p99 produce/fetch · disk per broker**.

Runbook singkat:

1. **Lag melonjak** — consumer hidup? poison pill di DLT? rebalance berulang?
2. **Under-replicated** — broker tersangkut? disk/jaringan? tunggu penyusulan / restart.
3. **DLT bertambah** — baca exception → transient (tunggu) atau permanen (perbaiki producer) → **replay** (idempotensi tetap aktif).
4. **Disk hampir penuh** — partisi terbesar? perpendek retensi? tambah kapasitas?

---

## Checklist kesiapan produksi

- **Topik & partisi** — RF 3, min.insync 2, jumlah sesuai hitungan, tata nama konsisten.
- **Penulisan** — acks all, idempotence, outbox.
- **Consumer** — commit manual, idempoten, DLT, `auto.offset.reset` disengaja.
- **Keamanan** — authorizer + ACL, SASL, TLS eksternal, kredensial di secret manager.
- **Skema** — registry aktif, auto-register **mati** di production, BACKWARD/FULL.
- **Monitoring** — 5 panel, alert berdurasi, runbook.
- **Operasional** — backup, uji failover berkala, retensi per topik, kapasitas disk.

---

## Pemeriksaan mandiri: uji sistem bekerja

```bash
# 1) kirim pesanan uji
kafka-console-producer.sh --bootstrap-server localhost:9092 \
  --topic order-events --property parse.key=true --property key.separator=| <<'EOF'
ORD-1001|{"event_id":"evt-1","event_type":"order.created","data":{"order_id":"ORD-1001","total":250000}}
ORD-1002|{"event_id":"evt-2","event_type":"order.created","data":{"order_id":"ORD-1002","total":175000}}
EOF

# 2) pastikan lag menyusut ke nol
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group payment-service --describe

# 3) payload rusak → masuk DLT
kafka-console-producer.sh --bootstrap-server localhost:9092 \
  --topic order-events --property parse.key=true --property key.separator=| <<'EOF'
ORD-BAD|{"event_id":"evt-bad","event_type":BROKEN_JSON
EOF
kafka-console-consumer.sh --bootstrap-server localhost:9092 \
  --topic order-events.dlt --from-beginning

# 4) uji pemulihan: matikan satu broker
docker stop kafka && \
  kafka-topics.sh --bootstrap-server localhost:9092 \
  --describe --under-replicated-partitions
docker start kafka   # tunggu ISR pulih
```

- Uji **DLT** = bukti jalur error berfungsi (banyak tim hanya uji jalur sukses).
- Uji **matikan broker** = validasi rantai daya tahan penuh.
- **Lag kembali nol** = consumer commit benar; menggantung = masalah commit/rebalance.

---

## Latihan pemeriksaan mandiri

1. Mengapa key `order_id` bukan `user_id`? Akibat menggantinya?
2. Uraikan perjalanan 1 record dari HTTP hingga analitik (topik, group, mekanisme).
3. Bedanya `min.insync.replicas=1` vs 2 dengan RF 3?
4. DLT mencapai 10 ribu dalam 5 menit — **3 pertanyaan pertama**?
5. Kapan **outbox wajib**, kapan **dual write** masih boleh?
6. Lima panel dashboard + **3 alert** untuk sistem ini.

> ⚠️ **Kesalahan proyek nyata:** hanya uji jalur sukses · key tanpa pertimbangan · idempotensi dianggap opsional · retensi & kapasitas tak dihitung · tanpa runbook.

> 💡 **Langkah lanjutan:** (1) multi-datacenter saat butuh DR/latensi, (2) tiered storage bila retensi mahal, (3) stream processing lebih dalam, (4) **chaos test** berkala. Terus ukur & dokumentasikan alasan setiap keputusan.

---

## Rangkuman akhir perjalanan

**Konsep inti** → **operasional** → **baca/tulis** → **desain** → **keandalan** → **ekosistem** → **produksi** → **skala**.

Prinsip yang tak berubah: **ukur sebelum mengubah**, **asumsi harus diuji**, **kegagalan itu pasti — yang penting menanganinya**, dan **setiap konfigurasi punya alasan yang bisa dijelaskan**.

---

## Istilah

| Istilah | Arti |
|---------|------|
| Pipeline end-to-end | Alur data dari penerimaan hingga konsumsi akhir |
| Idempotensi | Proses ulang tak mengubah hasil akhir |
| Outbox | Data & event dalam satu transaksi DB |
| Dead Letter Topic | Tujuan pesan setelah percobaan habis |
| Projection | Model baca dari stream (CQRS) |
| Runbook | Langkah penanganan siap pakai saat alert |
| Checklist produksi | Daftar kesiapan sebelum dipakai nyata |
| Chaos test | Uji ketahanan dengan sengaja menyebabkan kegagalan |
