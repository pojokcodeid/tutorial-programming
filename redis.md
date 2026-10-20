# Roadmap Belajar Redis dari 0 sampai Mahir

## Tujuan

Mampu menggunakan Redis dari tingkat pemula hingga mahir, mulai dari memahami konsep dasar, menggunakan struktur data, mengintegrasikan Redis dengan Go, membangun sistem cache, hingga mengoptimalkan Redis untuk aplikasi production dan microservices.

**Estimasi durasi:** 12–16 minggu  
**Waktu belajar:** 1–2 jam per hari  
**Bahasa pemrograman:** Go  
**Tools:** Redis, Docker, Go, MariaDB, Redis CLI, Prometheus, Grafana

---

# Peta Perjalanan Belajar

1. Fondasi Redis
2. Instalasi dan Redis CLI
3. Struktur data Redis
4. Expiration, TTL, dan key design
5. Cache dan database
6. Integrasi Redis dengan Go
7. Transaksi dan operasi atomik
8. Pub/Sub, Streams, dan distributed locking
9. Session, rate limiting, dan keamanan
10. Persistence dan recovery
11. Memory management dan performa
12. High availability dan scaling
13. Observability dan monitoring
14. Docker dan CI/CD
15. Redis untuk microservices
16. Proyek akhir tingkat mahir

---

# Tahap 0 — Memahami Fondasi Redis

**Durasi:** 2–3 hari

## Materi

- [ ] Apa itu Redis?
- [ ] Bagaimana Redis bekerja?
- [ ] Pengertian in-memory database.
- [ ] Pengertian key-value store.
- [ ] Perbedaan Redis, MariaDB, SQL Server, dan Memcached.
- [ ] Kelebihan dan kekurangan Redis.
- [ ] Use case Redis dalam aplikasi modern.
- [ ] Redis sebagai cache, session store, counter, dan message broker.
- [ ] Kapan Redis cocok digunakan.
- [ ] Kapan Redis tidak cocok digunakan.

## Praktik

- [ ] Buat diagram alur aplikasi yang menggunakan Redis dan database.
- [ ] Identifikasi data aplikasi yang cocok disimpan di Redis.
- [ ] Identifikasi data yang harus tetap disimpan di database utama.

## Target

Mampu menjelaskan fungsi Redis dan alasan penggunaannya dalam aplikasi backend.

---

# Tahap 1 — Instalasi Redis dan Redis CLI

**Durasi:** 3–4 hari

## Materi

- [ ] Instalasi Redis menggunakan Docker.
- [ ] Menjalankan Redis server.
- [ ] Menggunakan `redis-cli`.
- [ ] Mengenal host dan port Redis.
- [ ] Mengenal logical database Redis.
- [ ] Memeriksa status server menggunakan `PING`.
- [ ] Memahami konfigurasi dasar Redis.
- [ ] Menggunakan `INFO` untuk melihat informasi server.

## Perintah dasar

```redis
PING

SET nama "Budi"

GET nama

EXISTS nama

TYPE nama

DEL nama

INFO server

INFO memory

DBSIZE
```
