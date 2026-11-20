# Planning — Bab Tutorial Elasticsearch (aplikasi web)

> Rujukan utama: [`roadmap-elasticsearch-podman.md`](../roadmap-elasticsearch-podman.md) — Level 0 sampai Level 10 + Capstone.
> Format mengikuti bab yang sudah ada: `content/haproxy/`, `content/apache-kafka/`, `content/nginx/`.
> Lokasi materi: **`content/elasticsearch/*.js`** (tampil di aplikasi web, bukan markdown).

---

## 1. Daftar 14 pelajaran

| # | File | id | Judul | chapter | Durasi | Level roadmap |
|---|------|----|-------|---------|--------|---------------|
| 1 | `01-fundamental-search-engine.js` | `fundamental-search-engine` | Fundamental Search Engine & Inverted Index | Fondasi | 12 menit | Level 0 |
| 2 | `02-setup-elasticsearch-podman.js` | `setup-elasticsearch-podman` | Menjalankan Elasticsearch dengan Podman | Fondasi | 15 menit | Level 1 |
| 3 | `03-rest-api-crud.js` | `rest-api-crud` | REST API & CRUD Document | Data & Indexing | 15 menit | Level 2 |
| 4 | `04-index-mapping.js` | `index-mapping` | Index, Mapping & Data Modeling | Data & Indexing | 16 menit | Level 3 |
| 5 | `05-query-dsl-dasar.js` | `query-dsl-dasar` | Query DSL & Search Fundamental | Pencarian | 16 menit | Level 4 |
| 6 | `06-advanced-search-aggregation.js` | `advanced-search-aggregation` | Advanced Search & Aggregation | Pencarian | 16 menit | Level 5 |
| 7 | `07-analyzer-text-processing.js` | `analyzer-text-processing` | Analyzer & Text Processing | Pencarian | 15 menit | Level 6 |
| 8 | `08-cluster-sharding.js` | `cluster-sharding` | Cluster, Sharding & Arsitektur Terdistribusi | Arsitektur | 16 menit | Level 7 |
| 9 | `09-performance-optimasi.js` | `performance-optimasi` | Performance, Indexing & Query Optimization | Operasional | 15 menit | Level 8A |
| 10 | `10-pagination-skala.js` | `pagination-skala` | Pagination Skalabel: search_after & PIT | Operasional | 14 menit | Level 8B |
| 11 | `11-security-elasticsearch.js` | `security-elasticsearch` | Security: User, Role, API Key & TLS | Operasional | 15 menit | Level 8C |
| 12 | `12-backup-restore.js` | `backup-restore` | Snapshot, Backup & Restore | Operasional | 14 menit | Level 8D |
| 13 | `13-integrasi-backend.js` | `integrasi-backend` | Integrasi Backend & Sinkronisasi Data | Integrasi | 16 menit | Level 9 |
| 14 | `14-capstone-product-search.js` | `capstone-product-search` | Capstone: Product Search & Discovery Platform | Capstone | 20 menit | Level 10 |

Kuis terpisah: `content/elasticsearch/quiz-questions.js` — **40 soal**, id `es01` … `es40`.

Sebaran kuis per level (3 soal per level, sisanya capstone):

- `es01`–`es03` = Level 0 · `es04`–`es06` = Level 1 · `es07`–`es09` = Level 2
- `es10`–`es12` = Level 3 · `es13`–`es15` = Level 4 · `es16`–`es18` = Level 5
- `es19`–`es21` = Level 6 · `es22`–`es24` = Level 7 · `es25`–`es27` = Level 8A
- `es28`–`es30` = Level 8B · `es31`–`es33` = Level 8C · `es34`–`es36` = Level 8D
- `es37`–`es38` = Level 9 · `es39`–`es40` = Capstone

---

## 2. Struktur file pelajaran (WAJIB)

```js
/* ============================================================
   Pelajaran Elasticsearch — 01: <Judul>
   ============================================================ */
'use strict';

window.ELASTICSEARCH_LESSONS = window.ELASTICSEARCH_LESSONS || [];

window.ELASTICSEARCH_LESSONS.push({
  id: '<id persis tabel>',
  title: '<judul>',
  chapter: '<chapter persis tabel>',
  duration: '<N> menit',
  intro: [ '<paragraf 1>', '<paragraf 2>', '<paragraf 3>' ],   // tepat 3
  objectives: [ ... ],                                          // tepat 4
  sections: [ ... ],
  recap: [ ... ]                                                // tepat 4
});
```

Aturan `sections` (dicek otomatis oleh `tests/smoke.js`):

1. **Minimal 4 section** dan **minimal 4 tipe berbeda** dari `text`, `example`, `tip`, `warn`, `vocab`.
2. **Wajib ada tepat SATU** section `text` yang memuat figur:
   `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 <tinggi>" width="760" role="img" aria-label="...">...</svg></div><figcaption>...</figcaption></figure>`
   - Kelas SVG pakai konvensi yang sudah ada: `u-hd`, `u-box`, `u-title`, `u-lbl`, `u-line`, panah `marker-end="url(#u-arrow)"`.
   - Panah `u-arrow` sudah didefinisikan global di `index.html` (tidak perlu didefinisikan ulang).
3. **Wajib ada** section `vocab` dengan `items` array pasangan `[istilah, penjelasan]` — minimal **6** item.
4. **Wajib ada** minimal satu `tip` ATAU `warn` (disarankan keduanya: `warn` = kesalahan umum pemula, `tip` = strategi belajar/praktik).
5. **Wajib ada** minimal 3 section `example` dengan bentuk:
   ```js
   {
     type: 'example',
     title: '...',
     lang: 'bash' | 'cfg' | 'text' | 'json' | 'http',
     output: false,
     code: `...`,
     explain: [ '...', '...' ]   // minimal 3
   }
   ```
   - `output` **harus `false`** (kode lab Podman tidak bisa dijalankan dari browser).
   - `code` **tidak boleh** mengandung tanda kutip balik (`` ` ``) maupun `${`.
   - Isi `code` dari lab roadmap: perintah `podman`, request/response `curl`/`http`, blok JSON body Elasticsearch.
6. **Tidak ada** section `type: 'live'` (bab infrastruktur tanpa editor HTML interaktif).
7. Ditutup dengan section `text` **Latihan** (`<h3>Latihan</h3><ol>...`) berisi 3–4 butir, dan **wajib memuat kata `Checkpoint`**.

Field HTML (`html`, `text`, `explain`, `intro`, `objectives`, `recap`):

- Boleh memakai template literal (backtick) sebagai pembungkus, tetapi **isi** string tidak boleh memuat `` ` `` atau `${`.
- Tag yang didukung renderer: `<h3>`, `<p>`, `<ul>/<ol>/<li>`, `<table>`, `<b>/<i>/<code>`, `<blockquote style="border-left:3px solid var(--accent);padding-left:12px;margin:12px 0">`.
- Setiap pelajaran ditutup blok Latihan, dan **recap** 4 poin ringkas ber-`<b>`.

---

## 3. Gaya penulisan

- Bahasa Indonesia, akrab dan konkret, konsisten memakai **kamu** (bukan "Anda").
- Tiap pelajaran dibuka dengan **analogi/metaphor** di `intro` (lihat `content/haproxy/01-persiapan-lab-podman.js`).
- Jangan menghafal API — jelaskan *kenapa*, lalu *buktikan dengan lab*.
- Setiap request Elasticsearch disertai penjelasan field pada `explain`.
- Selalu sebut **checkpoint** ala roadmap di bagian latihan/eksperimen.
- Peringatkan perbedaan lab vs produksi (security mati, heap 1g, tag versi 8.17.0, dll.).
- Semua contoh memakai **tag versi `8.17.0`** (Elasticsearch & Kibana sama) sesuai roadmap; jangan pakai `latest`.

## 4. Cakupan isi per pelajaran

Ikuti level roadmap apa adanya:

1. **Fundamental Search Engine** — search engine vs database vs data warehouse, use case (katalog produk, log, dokumen, autocomplete, analytics), document/JSON/index/field, inverted index, token & term, relevancy score, exact match vs full-text, gambaran arsitektur, simulasi dataset produk 3 dokumen, diskusi `gaming` vs `Laptop` vs `laptop`.
2. **Setup dengan Podman** — prasyarat, `mkdir -p elasticsearch-lab/data`, `compose.yaml` single-node (`discovery.type=single-node`, `xpack.security.enabled=false`, `ES_JAVA_OPTS=-Xms1g -Xmx1g`, healthcheck curl, volume `esdata`, network `elastic-lab`, Kibana 8.17.0), `podman compose up -d`, cek `curl localhost:9200`, `_cluster/health`, `_nodes`, lifecycle container (start/stop/restart/rm tanpa volume), lab persistent volume.
3. **REST API & CRUD** — HTTP methods, request body JSON, status response, path/query params, `_cat` APIs, `_cluster` APIs, `_index`/`_id`/`_source`, CRUD (`PUT /products`, `POST /products/_doc`, `GET`, `POST /_update`, `DELETE`), Bulk API NDJSON (wajib newline di akhir), latihan index `employees` 10 dokumen.
4. **Index, Mapping & Data Modeling** — index lifecycle, field, dynamic vs explicit mapping, data types (`text`, `keyword`, `long`, `float`, `boolean`, `date`, `object`, `nested`, `ip`, `geo_point`), multi-field `full_name.keyword`, field naming, mapping explosion, Reindex API, alias `employees_current`, tabel perbedaan `text` vs `keyword`.
5. **Query DSL & Search Fundamental** — Search API, `match_all`, `match`, `term`, `terms`, `range`, `exists`, `prefix`, `wildcard`, `ids`, `bool` (`must`/`should`/`filter`/`must_not`), query context vs filter context, sorting, pagination `from`/`size`, `_source` filtering, Explain API.
6. **Advanced Search & Aggregation** — `multi_match` dengan boost `name^3`, `match_phrase`, fuzzy, highlight, aggregation metric (`avg`, `min`, `max`, `sum`) & bucket (`terms`, `range`, `date histogram`), faceted search katalog, nested object vs `nested` + nested query/aggregation + trade-off, search template, suggesters/autocomplete.
7. **Analyzer & Text Processing** — character filter → tokenizer → token filter, standard/simple/whitespace/keyword analyzer, lowercase, stop words, stemming, synonym, custom analyzer di settings index, `_analyze` API, normalizer, uji teks Bahasa Indonesia (imbuhan, stop words, synonym), evaluasi analyzer sebelum dipakai produksi.
8. **Cluster, Sharding & Distributed** — cluster/node, node roles (master-eligible, data, ingest, coordinating), primary & replica shard, cluster state & health (green/yellow/red), allocation, discovery, replication, failover, split brain, cluster routing, index template, component template, data streams, lab multi-node Podman Compose (2 node dulu), allocation explain, alias untuk rolling index.
9. **Performance & Optimization** — JVM heap, memory pressure, disk I/O, bulk indexing, refresh interval, translog, segment & merge, query/request cache, field data & cardinality, shard sizing, hotspot, slow logs, Profile API, benchmark 1.000 vs 10.000 dokumen, single insert vs bulk, ukuran bulk, `podman stats`.
10. **Pagination Skalabel** — `from`/`size` & batas `index.max_result_window` (10.000), `search_after` dengan sort stabil, Point in Time (PIT), Scroll API untuk ekstraksi batch (bukan default pagination), cursor pagination, perbandingan tabel.
11. **Security** — kenapa security wajib di produksi, authentication, user & role, RBAC & index privileges, API key, TLS/HTTPS & certificate, network isolation, audit logging, security hardening, lab terpisah dengan security aktif, jangan commit credential.
12. **Snapshot & Backup** — snapshot repository (shared filesystem/fs), repository verification, snapshot & restore, hapus index lalu restore, disaster recovery, backup policy, RPO & RTO, dokumentasi prosedur recovery.
13. **Integrasi Backend** — HTTP client, connection pooling, timeout, retry berbatas, error handling, bulk ingestion, DB sebagai source of truth & index sebagai derived data, event-driven indexing, outbox pattern, idempotency, reconciliation, mapping versioning, alias & reindex migration, observability & health check, simulasi ES down, arsitektur diagram frontend→backend→(ES | DB).
14. **Capstone Product Search & Discovery** — arsitektur lengkap, model produk (id, name, description, category, brand, price, stock, status, tags, created, rating), fitur search (full-text, multi-field, fuzzy, highlight, autocomplete, synonym, typo tolerance), filtering, sorting, analytics/aggregation, operasional (compose, persistent, health check, logging, monitoring, security, backup, load testing), Definition of Done, rubrik "mahir".

---

## 5. Kuis (`quiz-questions.js`)

```js
window.ELASTICSEARCH_QUIZ_POOL = window.ELASTICSEARCH_QUIZ_POOL || [];

window.ELASTICSEARCH_QUIZ_POOL.push(
  { id: 'es01', q: '...', options: [4 opsi], answer: <0-3>, explain: '...' },
  ... 40 soal ...   // es01 … es40
);
```

- Distribusi per sebaran di §1 (3 soal per level, 2 soal Level 9, 2 soal capstone = 40).
- Sebar `answer` secara merata di indeks 0–3 (minimal 8 soal tiap indeks); `explain` menjelaskan *kenapa* jawaban benar.

## 6. Registrasi (dikerjakan setelah file pelajaran ada)

- [ ] `js/content.js` — entry `elasticsearch` + daftar `return { ... }`.
- [ ] `index.html` — `<script>` 15 file (quiz dulu, lalu 01–14) sebelum `js/content.js`.
- [ ] `tests/smoke.js` — daftar `order` + blok pemeriksaan bab Elasticsearch.
- [ ] `assets/logos/elasticsearch.svg`.
- [ ] `README.md` dan `info.md` — deskripsi bab baru.

## 7. Validasi sebelum selesai

```bash
for f in content/elasticsearch/*.js; do node --check "$f"; done
node tests/smoke.js
```

Kedua perintah harus lulus 100%.
