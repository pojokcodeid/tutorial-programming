# Pelajaran 3 — Menjalankan Kafka: Environment & KRaft

> **Durasi:** ± 15 menit
> **Prasyarat:** Pelajaran 1–2, Docker/Podman terpasang, dasar YAML

---

## Tujuan belajar

Setelah pelajaran ini kamu bisa:

- Menyiapkan **container Kafka satu broker** dengan image resmi `apache/kafka` dan mode KRaft.
- Menjelaskan fungsi tiap **variabel env KAFKA_*** utama.
- Menghubungkan **port 9092 (client)** dan **9093 (controller)** dengan kebutuhan koneksi.
- **Memverifikasi broker siap**: membuat topic, mengirim record, membacanya kembali.

---

## Komponen environment latihan

Untuk belajar tidak butuh cluster besar. Satu container dengan dua peran (**broker + controller**) sudah cukup:

- **Kafka broker** — image resmi `apache/kafka` dari Docker Hub, mode KRaft (tanpa ZooKeeper).
- **Kafka CLI tools** — ikut di dalam image pada `/opt/kafka/bin/`.
- **Kafka UI (opsional)** — untuk inspeksi visual topic dan record.
- **Volume** — menyimpan log partition supaya data bertahan saat restart.
- **Network khusus** — agar container lain bisa mengakses broker lewat nama service.

```text
                 ┌──────────────────────────────────────────────┐
Host / CLI ─────▶│ Container: apache/kafka (KRaft)              │──▶ Kafka UI (opsional)
docker exec      │  Broker :9092 (client)   Controller :9093    │
                 │  /opt/kafka/bin (CLI)    LOG_DIRS (logs)     │
                 └──────────────────┬───────────────────────────┘
                                    ▼
                            Volume: kafka-data
```

---

## Mengenal variabel env KRaft

| Variabel | Fungsi |
|----------|--------|
| `KAFKA_NODE_ID` | Identitas unik broker ini di cluster (mis. 1) |
| `KAFKA_PROCESS_ROLES` | Peran: `broker`, `controller`, atau `broker,controller` (combined) |
| `KAFKA_LISTENERS` | Alamat & port yang **diproses** (bind), mis. `PLAINTEXT://:9092,CONTROLLER://:9093` |
| `KAFKA_ADVERTISED_LISTENERS` | Alamat yang **diumumkan ke client** — harus dapat diakses dari mesin client |
| `KAFKA_CONTROLLER_QUORUM_VOTERS` | Daftar anggota quorum controller, mis. `1@localhost:9093` |
| `KAFKA_CONTROLLER_LISTENER_NAMES` | Nama listener komunikasi controller (`CONTROLLER`) |
| `KAFKA_LISTENER_SECURITY_PROTOCOL_MAP` | Pemetaan listener → protokol (PLAINTEXT, SSL, SASL_...) |
| `KAFKA_INTER_BROKER_LISTENER_NAME` | Listener untuk komunikasi antarbroker |
| `KAFKA_LOG_DIRS` | Lokasi penyimpanan log partition |
| `CLUSTER_ID` | UUID cluster (base64) — wajib sama untuk semua broker |

---

## docker-compose.yaml: satu broker KRaft siap pakai

```yaml
services:
  kafka:
    image: docker.io/apache/kafka:4.4.0
    container_name: kafka
    ports:
      - "9092:9092"
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_LISTENERS: PLAINTEXT://:9092,CONTROLLER://:9093
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@localhost:9093
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,CONTROLLER:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_LOG_DIRS: /tmp/kraft-combined-logs
      CLUSTER_ID: MkU3OEVBNTcwNTJENDM2Qk
    volumes:
      - kafka-data:/tmp/kraft-combined-logs

volumes:
  kafka-data:
```

- `KAFKA_PROCESS_ROLES: broker,controller` → satu container berperan ganda (combined mode) untuk latihan.
- `advertised.listeners` memakai `localhost:9092` supaya client di host tersambung; pada cluster multi-broker harus nama service/host yang dapat diakses semua client.
- `CLUSTER_ID` mengikat broker ke satu cluster — semua broker wajib memakai CLUSTER_ID identik.

---

## Jalankan dan verifikasi

```bash
docker compose up -d

# pastikan broker benar-benar melayani koneksi
docker exec kafka /opt/kafka/bin/kafka-broker-api-versions.sh \
  --bootstrap-server localhost:9092

# buat topic latihan 3 partition
docker exec kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic user-events --partitions 3 --replication-factor 1

# daftar & detail topic
docker exec kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 --list
docker exec kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 --describe --topic user-events
```

- `kafka-broker-api-versions.sh` adalah cara termudah memastikan broker siap — bila belum siap, perintah gagal timeout.
- Masuk shell interaktif dengan `docker exec -it kafka bash` agar tidak mengetik path panjang berulang.
- `--describe` menampilkan leader, replicas, dan ISR tiap partition — tabel yang akan dibaca berulang di pelajaran replication.

---

## Port 9092 vs 9093

- **9092** — listener client (PLAINTEXT): tempat producer/consumer menulis dan membaca.
- **9093** — listener controller: komunikasi internal quorum KRaft. Client biasanya tidak menyentuhnya.

**Jebakan klasik:** `advertised.listeners` menunjuk `localhost:9092` tetapi container diakses dari mesin lain → client gagal **tepat setelah discovery pertama**, karena broker memberitahu alamat yang tidak dapat diakses client.

---

## Persistensi & pembuatan ulang

Dengan volume pada `KAFKA_LOG_DIRS`, data bertahan saat restart:

```bash
docker compose restart kafka      # record tetap bisa dibaca
docker compose down -v            # mulai dari nol (hapus volume)
```

Karena seluruh environment dideklarasikan satu file compose, ia **dapat dibuat ulang kapan pun** — prinsip reproducible environment yang dipakai sepanjang bab ini.

---

## Jebakan awal yang paling sering terjadi

- **Broker belum siap tapi langsung dipakai** — beri jeda atau ulangi verifikasi.
- **advertised.listeners salah** — client gagal setelah koneksi pertama.
- **CLUSTER_ID berbeda antarbroker** — broker menolak bergabung.
- **Port bentrok di host** — gunakan `19092:9092` lalu sesuaikan client.
- **Salah path CLI** — image `apache/kafka` menyimpannya di `/opt/kafka/bin/`.

---

## Rangkuman

- Kafka modern berjalan dengan **satu container KRaft** — tanpa ZooKeeper — memakai image resmi `apache/kafka`.
- Env inti: **NODE_ID, PROCESS_ROLES, LISTENERS, ADVERTISED_LISTENERS, CONTROLLER_QUORUM_VOTERS, LOG_DIRS, CLUSTER_ID**.
- **9092 = port client**, **9093 = port controller**; advertised.listeners harus dapat diakses dari mesin client.
- CLI di `/opt/kafka/bin/`; compose + volume membuat latihan **dapat diulang dan data bertahan saat restart**.

## Latihan

1. Jalankan Kafka satu broker dan buktikan siap lewat `kafka-broker-api-versions.sh`.
2. Buat topic `user-events` 3 partition, tampilkan `--describe`, identifikasi leader tiap partition.
3. Jelaskan perbedaan `KAFKA_LISTENERS` dan `KAFKA_ADVERTISED_LISTENERS` dengan bahasamu sendiri.
4. Kirim 10 record, restart container, baca lagi — data masih ada? Mengapa?
5. Apa yang terjadi bila `CLUSTER_ID` dua broker berbeda?

## Istilah

| Istilah | Arti |
|--------|------|
| KRaft | Mode Kafka pengelola metadata sendiri tanpa ZooKeeper |
| Broker | Server Kafka penyimpan partition |
| Controller | Broker pengkoordinasi metadata & pemilihan leader |
| Quorum | Anggota controller pemenang/menjaga metadata KRaft |
| Listeners | Alamat & port yang di-bind broker |
| Advertised listeners | Alamat yang diumumkan ke client |
| LOG_DIRS | Direktori log partition di disk |
| Replication factor | Jumlah salinan partition (leader + follower) |

---

**Lanjut → [Pelajaran 4 — KRaft vs ZooKeeper](04-kraft-vs-zookeeper.md)**
