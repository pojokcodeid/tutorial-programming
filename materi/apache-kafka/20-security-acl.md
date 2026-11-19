# Pelajaran 20 — Security: SSL, SASL & ACL

> **Durasi:** ± 15 menit
> **Prasyarat:** Pelajaran 3–5 (environment & CLI)

---

## Tujuan belajar

Setelah pelajaran ini kamu bisa:

- Menjelaskan **tiga lapis keamanan** Kafka.
- Menerapkan **SSL/TLS** antar-broker dan client.
- Mengonfigurasi **SASL** (PLAIN, SCRAM) beserta trade-off.
- Menulis & mengelola **ACL** per principal, topic, operasi.

---

## Tiga lapis keamanan

| Lapis | Pertanyaan | Mekanisme |
|-------|-----------|-----------|
| **Enkripsi** | Bisa dibaca pihak lain? | SSL/TLS |
| **Autentikasi** | Siapa yang terhubung? | SASL / mTLS |
| **Otorisasi** | Boleh melakukan apa? | ACL |

Saling melengkapi: TLS tanpa autentikasi = percuma; autentikasi tanpa ACL = user biasa bisa hapus topic. Pola produksi: **TLS + SASL/SCRAM + ACL ketat**, atau **mTLS + ACL**.

```text
Client ──TLS──▶ Broker:9092/9093
                 1. TLS   — koneksi terenkripsi (truststore + sertifikat)
                 2. SASL  — buktikan identitas (SCRAM-SHA-256 / PLAIN / mTLS)
                 3. ACL   — boleh topic apa, operasi apa
                       ▶ Kafka (topic aman)

Tanpa TLS: lalu lintas terbaca pihak ketiga (SASL PLAIN ikut terekspos)
Tanpa ACL: satu identitas baca semua topic — least privilege dilanggar
```

---

## SSL/TLS

```bash
# 1) keystore & truststore
keytool -genkeypair -alias kafka-broker -keyalg RSA -keysize 2048 \
  -keystore kafka.keystore.jks -dname "CN=kafka, OU=ops, O=corp, C=ID"
keytool -export -alias kafka-broker -keystore kafka.keystore.jks -file kafka.cer
keytool -import -trustcacerts -alias kafka-broker -file kafka.cer \
  -keystore kafka.truststore.jks
```

```properties
# broker.properties
listeners=INTERNAL://:9093,EXTERNAL://:9092
advertised.listeners=INTERNAL://kafka1:9093,EXTERNAL://kafka.example.id:9092
security.inter.broker.protocol=SSL
ssl.keystore.location=/etc/kafka/secrets/kafka.keystore.jks
ssl.keystore.password=***
ssl.truststore.location=/etc/kafka/secrets/kafka.truststore.jks
ssl.truststore.password=***
ssl.client.auth=required          # mTLS bila dipakai

# client
bootstrap.servers=kafka.example.id:9092
security.protocol=SSL
ssl.truststore.location=/etc/kafka/client.truststore.jks
```

- Listener **INTERNAL** (antar-broker) vs **EXTERNAL** (client) → keamanan boleh beda.
- `ssl.client.auth=required` = **mTLS** (client juga menunjukkan sertifikat).
- Keystore = kunci pribadi → lindungi file-nya / pakai secret manager.

---

## SASL: memilih mekanisme

| Mekanisme | Cara kerja | Catatan |
|-----------|-----------|---------|
| **PLAIN** | Password dalam teks (wajib dalam TLS) | Sederhana; tanpa TLS = password terbaca |
| **SCRAM-SHA-256/512** | Challenge–response, password tak dikirim mentah | **Pilihan produksi wajar** |
| **GSSAPI/Kerberos** | Tiket Kerberos | Lingkungan yang sudah pakai Kerberos |
| **mTLS** | Sertifikat klien | Service-to-service tanpa password |

```properties
# broker.properties
listeners=SASL_SSL://:9093
security.inter.broker.protocol=SASL_SSL
sasl.mechanism.inter.broker.protocol=SCRAM-SHA-256
sasl.enabled.mechanisms=SCRAM-SHA-256

# buat user SCRAM
kafka-configs.sh --bootstrap-server localhost:9093 \
  --alter --add-config 'SCRAM-SHA-256=[iterations=8192,password=rahasia]' \
  --entity-type users --entity-name app-producer

# client
security.protocol=SASL_SSL
sasl.mechanism=SCRAM-SHA-256
sasl.jaas.config=org.apache.kafka.common.security.scram.ScramLoginModule \
  required username="app-producer" password="rahasia";
```

- **SASL_SSL** = autentikasi + enkripsi bersamaan (lazim di produksi).
- User SCRAM disimpan di **internal topic** (bukan file teks).
- Jangan lupa **inter-broker** — kalau tidak, jaringan internal bisa menyamar jadi broker.

---

## ACL: batasi tindakan per identitas

- **Principal** — identitas hasil autentikasi.
- **Resource** — `topic:order-events`, `group:payment-service`, `cluster:kafka-cluster`, `*`.
- **Operasi** — READ, WRITE, CREATE, DELETE, DESCRIBE, ALTER, ALL.
- **Aksi** — ALLOW / DENY (**DENY menang lebih dulu**).

```bash
# producer: hanya tulis order-events
kafka-acls.sh --bootstrap-server localhost:9093 \
  --add --allow-principal User:app-producer --producer --topic order-events

# consumer: hanya baca + group-nya sendiri
kafka-acls.sh --bootstrap-server localhost:9093 \
  --add --allow-principal User:payment-service \
  --consumer --topic order-events --group payment-service

# DENY eksplisit
kafka-acls.sh --bootstrap-server localhost:9093 \
  --add --deny-principal User:intern --topic order-events --operation Read

# audit & hapus
kafka-acls.sh --bootstrap-server localhost:9093 --list
kafka-acls.sh --bootstrap-server localhost:9093 \
  --remove --allow-principal User:app-producer --producer --topic order-events
```

```properties
# broker: aktifkan otorisasi (tanpa ini, ACL tak berlaku!)
authorizer.class.name=org.apache.kafka.metadata.authorizer.StandardAuthorizer
super.users=User:ops-admin
```

**Least privilege:** producer = WRITE+DESCRIBE; consumer = READ+DESCRIBE(topik+group); tak ada app yang butuh CLUSTER ALTER.

---

## Kesalahan paling sering

- **Listener tanpa autentikasi** — satu port terbuka = semua upaya lain percuma.
- **PLAIN tanpa TLS** — password mentah di jaringan.
- **ACL wildcard `*` untuk banyak principal** — satu kebocoran langsung luas.
- **Service account dipakai bersama** — tak bisa dilacak; satu identitas per aplikasi.
- **Kredensial hard-coded** — pakai secret manager + rotasi.
- **Lupa amankan Schema Registry / Connect / UI** — jendela ke data yang sama.
- **Menganggap jaringan internal aman** — zero-trust, enkripsi tetap perlu antar-broker.

> 💡 **Roadmap bertahap:** (1) authorizer + ACL dasar, (2) SASL/SCRAM, (3) TLS listener eksternal, (4) mTLS antar-broker, (5) audit berkala + rotasi. Tiap langkah berdiri sendiri dan tetap bermanfaat.

---

## Rangkuman

- **TLS** (baca isi) + **SASL/mTLS** (siapa) + **ACL** (boleh apa).
- **SCRAM** = pilihan produksi; PLAIN hanya dalam TLS; mTLS untuk service-to-service.
- **ACL** = principal + resource + operasi + ALLOW/DENY; aktifkan `authorizer.class.name`.
- Bertahap: **authorizer+ACL → SASL → TLS → mTLS → audit**.

## Latihan

1. Tiga lapis keamanan + **contoh pelanggaran** masing-masing.
2. Mengapa **PLAIN tanpa TLS** berbahaya? Bagaimana **SCRAM** menghindarinya?
3. Tulis ACL: hanya **baca 2 topic** + group sendiri.
4. Manfaat pemisahan listener **INTERNAL vs EXTERNAL**.
5. Roadmap pengetatan untuk **tim kecil** (3–5 langkah).

## Istilah

| Istilah | Arti |
|---------|------|
| Enkripsi (TLS/SSL) | Lalu lintas tak terbaca pihak ketiga |
| Autentikasi | Membuktikan identitas penghubung |
| Otorisasi (ACL) | Tindakan yang boleh dilakukan |
| SASL | Kerangka autentikasi (PLAIN, SCRAM) |
| SCRAM-SHA-256 | Challenge–response berbasis password |
| mTLS | Mutual TLS: client ikut bersertifikat |
| JAAS | Konfigurasi login Java untuk SASL |
| Least privilege | Hak paling sedikit yang dibutuhkan |

---

**Lanjut → [Pelajaran 21 — Monitoring & Observability](21-monitoring-observability.md)**
