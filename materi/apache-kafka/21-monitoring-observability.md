# Pelajaran 21 — Monitoring & Observability

> **Durasi:** ± 15 menit
> **Prasyarat:** Pelajaran 16–20

---

## Tujuan belajar

Setelah pelajaran ini kamu bisa:

- Memilih **metrik broker, producer, consumer** yang menentukan kesehatan.
- Mengukur & memantau **consumer lag** sebagai detektor dini.
- Merancang **dashboard & alerting** yang bermakna.
- Menjelaskan pengumpulan **metrics & logs** dari broker dan client.

---

## Tiga pilar observabilitas

- **Metrics** → *kapan* dan *seberapa parah*.
- **Logs** → *apa* yang terjadi.
- **Traces** → *di mana* letak masalah (butuh correlation ID).

```text
Broker (JMX)  ─┐
Producer app  ─┼─▶ Prometheus ─▶ Dashboard (throughput, lag, ISR, p99)
Consumer app  ─┘        │
                        └─▶ Alerting (Slack / PagerDuty)
App logs ────────▶ Log store (ELK/Loki) ─▶ korelasi dengan traces
```

---

## Metrik wajib

```text
BROKER (JMX)
BytesInPerSec / BytesOutPerSec              # traffic
UnderReplicatedPartitions                    # ISR < RF (BAHAYA)
LeaderElectionRateAndTime                    # pindah leadership
Log Size                                     # ukuran per topic
RequestHandlerAvgTime                        # antrian handler
TotalTimeMs{purpose=Produce|Fetch}           # p99 broker

PRODUCER
record-send-total / record-error-total       # error naik = masalah
record-max-latency-ms / request-latency-avg  # latency

CONSUMER
records-lag-max                              # lag tertinggi (per partition)
heartbeat-frequency-avg                      # jantung hidup
commit-latency-avg                           # latensi commit
```

- **UnderReplicatedPartitions > 0** = pintu kehilangan data.
- **records-lag-max** lebih berguna dari rata-rata (satu partisi bisa tertinggal sendirian).
- **TotalTimeMs per purpose** — Fetch melonjak padahal throughput stabil → disk/replikasi.

---

## Consumer lag: detektor dini terbaik

**Lag** = offset terproduksi − offset terkonsumsi.

- **Nol/stabil** — sehat.
- **Naik terus** — consumer tak sanggup/macet; selisih = backlog menumpuk.
- **Melonjak lalu turun** — restart, rebalance, atau lonjakan traffic.

Pantau **per group & per partition** — total bisa menipu.

```bash
# lag per partition
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group payment-service --describe
#   TOPIC          PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG
#   order-events   0          15230          15344           114
#   order-events   1          15102          15102           0

# kesehatan cluster
kafka-metadata.sh --bootstrap-server localhost:9092 --describe --topics order-events
kafka-topics.sh --bootstrap-server localhost:9092 --describe --under-replicated-partitions

# log broker: perpindahan leadership & error
docker exec kafka grep -E "(State transition|ERROR|Shutdown)" \
  /var/log/kafka/server.log | tail -20
```

- **CURRENT vs LOG-END** = sumber kebenaran lag.
- `--under-replicated-partitions` harus **kosong** saat sehat.
- "State transition" berulang = broker tidak stabil.

---

## Dashboard & alerting bermakna

Dashboard berlapis: **apakah sehat?** → **di mana?** → **sejak kapan?**

1. Ringkasan cluster (broker hidup, under-replicated, disk)
2. Traffic (bytes in/out, record/detik)
3. Latensi (**p99** produce & fetch)
4. Consumer lag per group + garis ambang
5. Resource (disk, CPU, file descriptor)

**Alert harus ditindaklanjuti** — pakai **durasi** (`for:`), bukan titik tunggal:

```yaml
groups:
  - name: kafka
    rules:
      - alert: KafkaUnderReplicatedPartitions
        expr: kafka_server_replicamanager_underreplicatedpartitions > 0
        for: 5m
        labels: {severity: critical}

      - alert: KafkaConsumerLagHigh
        expr: max by (group, topic, partition) (kafka_consumergroup_lag) > 10000
        for: 10m
        labels: {severity: warning}

      - alert: KafkaConsumerLagCritical
        expr: max by (group, topic) (kafka_consumergroup_lag) > 1000000
        for: 5m
        labels: {severity: critical}
```

- `for:` menghindari alarm sesaat akibat restart/rebalance wajar.
- Lag bertingkat: warning 10 ribu, critical 1 juta → respons berbeda.
- Ambang = **beberapa kali backlog normal yang masih aman** (bukan angka universal).

---

## Tracing dengan correlation ID

1. API membuat `X-Request-Id`.
2. Producer menaruhnya di **header record** (bukan payload — tak memengaruhi partitioning).
3. Consumer membaca header → mencatat di log → meneruskan ke service berikutnya.
4. Satu ID menampilkan rantai: HTTP → producer → broker → consumer → DB.

*Pengguna komplain "pesanan tidak masuk" → ketik satu ID → lihat tepat di mana berhenti.*

---

## Praktik pengumpulan

- **Broker** — JMX → Prometheus exporter (pasang sejak awal).
- **Client** — metrics producer/consumer (Micrometer) sebagai standar kerangka.
- **Logs** — JSON + request/record ID; retensi teratur.
- **Cardinality** — jangan jadikan `order_id` label metrics (meledak); untuk logs/traces.
- **Korelasi** — satu ID lintas metrics, logs, traces.

> ⚠️ **Perangkap:** hanya rata-rata (lewatkan p99) · alert tanpa runbook · dashboard terlalu banyak · lupa Connect/Registry · retensi metrics terlalu pendek.

> 💡 **Checklist minimum:** (1) metrics broker + dashboard ringkasan, (2) lag per group + ambang, (3) alert under-replicated & disk hampir penuh, (4) correlation ID mengalir API → consumer, (5) runbook tiap alert.

---

## Rangkuman

- **Metrics** (kapan/seberapa) + **logs** (apa) + **traces** (di mana) + correlation ID.
- Kunci: **UnderReplicatedPartitions**, **records-lag-max per partition**, p99, disk.
- **Consumer lag** = detektor dini terbaik — per group & partition, ambang bertingkat.
- Alert **ditindaklanjuti**: durasi `for`, runbook, hindari noise.

## Latihan

1. Enam **metrik broker** wajib + maknanya.
2. Mengapa **lag per partition** lebih informatif dari rata-rata total?
3. Skenario: under-replicated > 0 selama 10 menit — arti & langkah pertama?
4. Rancang **5 panel** + **3 aturan alert** dengan durasi `for`.
5. Uraikan alur **correlation ID** HTTP → consumer + manfaatnya saat insiden.

## Istilah

| Istilah | Arti |
|---------|------|
| Metrics | Angka kesehatan sistem berkala |
| Consumer lag | Selisih offset produksi & konsumsi |
| Under-replicated partition | Replika kurang dari konfigurasi |
| Leader election | Pindahnya broker pemimpin partition |
| p99 latency | 99% request lebih cepat dari nilai ini |
| Correlation ID | ID unik pelacak satu request lintas layanan |
| JMX | Sumber metrics broker Kafka |
| Runbook | Dokumen langkah saat alert berbunyi |

---

**Lanjut → [Pelajaran 22 — Storage, Retention & Recovery](22-storage-retention-recovery.md)**
