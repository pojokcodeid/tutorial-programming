# Pelajaran 4 — KRaft vs ZooKeeper

> **Durasi:** ± 12 menit
> **Prasyarat:** Pelajaran 3 (environment & KRaft)

---

## Tujuan belajar

Setelah pelajaran ini kamu bisa:

- Menjelaskan peran **ZooKeeper** pada arsitektur Kafka lama dan mengapa perannya besar.
- Menjelaskan cara **KRaft** bekerja: controller, broker, dan metadata quorum berbasis Raft.
- Membandingkan **ZooKeeper vs KRaft** dari sisi komponen, operasi, dan skalabilitas.
- Menyebutkan **langkah migrasi umum** serta alasan tutorial lama masih memakai ZooKeeper.

---

## Arsitektur lama: Kafka + ZooKeeper

Pada versi lama, Kafka tidak mengelola metadata-nya sendiri. Semua informasi krusial disimpan di **ZooKeeper**, sistem terpisah untuk koordinasi:

- Daftar broker yang aktif.
- Partition mana yang leader-nya di broker mana.
- Konfigurasi topic (partitions, replication, cleanup policy).
- Siapa controller aktif.

Akibatnya operasi jadi **dua sistem sekaligus**:

- ZooKeeper berjalan sebagai **ensemble** (3 atau 5 node) dengan pemilihan leader sendiri.
- Broker bergantung penuh pada ZooKeeper — ZooKeeper mati, **perubahan metadata berhenti**.
- Deploy, monitoring, upgrade, dan troubleshooting berlaku untuk **dua stack**.

---

## Apa itu KRaft?

**KRaft (Kafka Raft)** adalah mode di mana Kafka **mengelola metadata-nya sendiri di dalam prosesnya**. Dua peran utama:

- **Controller** — mengelola metadata cluster: daftar broker, penetapan leader partition, create/delete topic, perubahan konfigurasi.
- **Broker** — menyimpan partition dan melayani produksi/konsumsi data.

Keduanya bisa berjalan terpisah atau **combined** (latihan kita memakai `broker,controller`). Yang baru adalah **metadata quorum**: kumpulan controller (anggota voting) yang menyimpan metadata pada log internal dan mencapai kesepakatan lewat protokol **Raft**. Metadata menjadi:

- **Tahan kegagalan** — selama mayoritas quorum hidup, metadata tetap dapat berubah.
- **Ter-replikasi** — tiap anggota menyimpan salinan metadata.
- **Otomatis tervalidasi** — perubahan hanya diterima bila disetujui quorum.

```text
ZOOKEEPER (lama)                      KRAFT (modern)
────────────────                      ────────────────
ZooKeeper ensemble (3-5 node)         Metadata quorum (Raft)
  • daftar broker                       • disimpan di log Kafka
  • leader partition                    • voting antar controller
  • konfigurasi topic                 Broker (process.roles)
Broker Kafka                           • broker: simpan partition
  • simpan partition                    • controller: kelola metadata
  • produce/consume                     • broker,controller: keduanya

Dua stack, dua monitoring,            Satu proses, satu log,
dua jalur upgrade                     tanpa dependensi eksternal
```

---

## ZooKeeper vs KRaft

| Aspek | ZooKeeper | KRaft |
|-------|-----------|-------|
| **Komponen** | Ensemble ZK + broker Kafka | Hanya proses Kafka |
| **Metadata** | Disimpan di ZK (znode) | Disimpan di log internal quorum |
| **Skala metadata** | Terbatas — jutaan partisi mulai berat | Jauh lebih besar |
| **Latensi perubahan** | Lewat dua sistem | Langsung lewat quorum |
| **Operasional** | Dua stack, dua upgrade | Satu stack |
| **Status rilis** | Dihapus sejak Kafka 4.0 | Default & satu-satunya mode |

---

## Kenapa tutorial lama masih ZooKeeper?

Karena sebagian besar materi ditulis sebelum Kafka 4.0 (2025), ketika KRaft masih baru. Tutorial lama biasanya meminta:

1. Menjalankan `zookeeper-server-start.sh` lebih dulu.
2. Baru `kafka-server-start.sh` dengan `zookeeper.connect=localhost:2181`.
3. Memakai `kafka-topics.sh --zookeeper ...` (flag lama).

**Terjemahkan saja:** `--zookeeper localhost:2181` → `--bootstrap-server localhost:9092`; blok ZooKeeper → tidak diperlukan.

```bash
# TUTORIAL LAMA (ZooKeeper)
zookeeper-server-start.sh config/zookeeper.properties &
kafka-server-start.sh config/server.properties &
kafka-topics.sh --zookeeper localhost:2181 --create \
  --topic user-events --partitions 3 --replication-factor 1

# MODERN (KRaft, tanpa ZooKeeper)
docker compose up -d
docker exec kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 --create \
  --topic user-events --partitions 3 --replication-factor 1
```

---

## Kesalahan konsep yang sering terjadi

- **Menyangka KRaft menggantikan replication** — tidak; KRaft menggantikan ZooKeeper untuk **metadata**, replikasi data tetap leader/follower.
- **Menjalankan ZooKeeper untuk Kafka 4.x** — mode itu sudah tidak didukung.
- **Mengira controller hanya satu permanen** — quorum punya banyak anggota; satu menjadi controller aktif dan bisa berpindah.
- **Menyalin `zookeeper.connect` dari tutorial lama** — di KRaft tidak dipakai.

> 💡 **Tips wawancara:** "Apa perbedaan ZooKeeper dan KRaft?" → metadata dulu dipegang layanan koordinasi terpisah; dengan KRaft, metadata dipegang quorum internal Kafka berbasis Raft — satu sistem, lebih sederhana, skala partition jauh lebih besar.

---

## Rangkuman

- ZooKeeper dulu menyimpan **metadata Kafka**: daftar broker, leader partition, konfigurasi topic.
- **KRaft memindahkan metadata ke dalam Kafka** lewat metadata quorum berbasis Raft.
- KRaft unggul: **satu stack operasional, skalabilitas metadata, latensi perubahan**.
- Kafka 4.0 **KRaft-only**; tutorial lama tinggal diterjemahkan ke `--bootstrap-server`.

## Latihan

1. Sebutkan **empat informasi metadata** yang dulu disimpan ZooKeeper.
2. Jelaskan peran **controller** dan **metadata quorum** dengan bahasamu sendiri.
3. Mengapa ZooKeeper mati bisa melumpuhkan perubahan metadata Kafka?
4. Tulis versi modern (KRaft) dari perintah yang memakai `--zookeeper`.
5. Apa tiga keuntungan operasional KRaft?

## Istilah

| Istilah | Arti |
|--------|------|
| KRaft | Kafka Raft — pengelolaan metadata internal tanpa ZooKeeper |
| ZooKeeper | Sistem koordinasi terpisah penyimpan metadata Kafka (lama) |
| Controller | Broker aktif pengelola metadata & pemilihan leader |
| Metadata quorum | Anggota voting penyimpan metadata KRaft |
| Raft | Protokol konsensus: pemilihan leader + replikasi log |
| Combined mode | Broker yang menjadi broker dan controller sekaligus |
| process.roles | Konfigurasi peran proses Kafka |

---

**Lanjut → [Pelajaran 5 — Perintah CLI Kafka Sehari-hari](05-kafka-cli.md)**
