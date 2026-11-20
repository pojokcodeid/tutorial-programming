# Roadmap Belajar Elasticsearch dari 0 sampai Mahir
## Hands-on Lab dengan Podman

> Roadmap praktis untuk belajar Elasticsearch dari fundamental hingga siap mengoperasikan dan mengintegrasikannya ke aplikasi. Semua latihan dilakukan dengan simulasi container menggunakan Podman.

---

## Target Akhir

Setelah menyelesaikan roadmap ini, kamu mampu:

- Memahami search engine, inverted index, dan konsep distributed search.
- Menjalankan Elasticsearch dan Kibana menggunakan Podman.
- Mengelola cluster, node, index, shard, dan replica.
- Menguasai REST API dan CRUD.
- Mendesain mapping dan struktur data yang tepat.
- Menggunakan Query DSL untuk pencarian sederhana sampai kompleks.
- Membuat full-text search, filtering, sorting, pagination, dan aggregation.
- Memahami analyzer, tokenizer, stemming, synonym, dan relevancy.
- Mengoptimalkan indexing dan query.
- Mengelola security, backup, restore, monitoring, dan troubleshooting.
- Mengintegrasikan Elasticsearch dengan backend.
- Menyelesaikan project simulasi production.

## Prasyarat

- Dasar terminal Linux/macOS.
- Memahami HTTP, JSON, REST API.
- Dasar SQL dan konsep database.
- Familiar dengan Docker/Podman akan membantu, tetapi tidak wajib.
- Memahami dasar pemrograman (Go, Java, JavaScript, Python, atau bahasa lainnya).

## Perangkat & Tools Lab

- Podman dan Podman Compose (atau `podman compose`).
- Elasticsearch.
- Kibana (opsional, untuk visualisasi dan Dev Tools).
- REST Client seperti `curl`, HTTPie, Postman, Bruno, atau file `.http`.
- Editor teks.
- Git untuk versioning lab.

> Catatan versi: gunakan image Elasticsearch dan Kibana dengan **versi tag yang sama**. Contoh di roadmap memakai tag versi yang dipatok (`8.17.0`) agar lab reproducible. Sebelum dipakai untuk pekerjaan nyata, cek versi stabil dan dokumentasi resmi terbaru, lalu sesuaikan tag. Jangan gunakan `latest` untuk lab yang ingin direproduksi.

---

# Level 0 — Fundamental Search Engine

## Tujuan

Memahami alasan Elasticsearch digunakan dan perbedaannya dengan database relasional.

## Materi

- [ ] Apa itu Search Engine?
- [ ] Perbedaan database, search engine, dan data warehouse.
- [ ] Use case Elasticsearch:
  - Search katalog produk.
  - Log dan observability.
  - Search dokumen.
  - Autocomplete.
  - Analytics.
- [ ] Konsep document.
- [ ] Konsep JSON.
- [ ] Konsep index.
- [ ] Konsep field.
- [ ] Konsep inverted index.
- [ ] Konsep token dan term.
- [ ] Relevancy score.
- [ ] Perbedaan exact match dan full-text search.
- [ ] Gambaran arsitektur Elasticsearch.

## Konsep Penting

### Database tradisional

Contoh query:

```sql
SELECT *
FROM products
WHERE product_name LIKE '%laptop%';
```

Database menyimpan record dan melakukan pencarian sesuai struktur serta index yang tersedia.

### Search Engine

Search engine membangun struktur khusus untuk mencari term di dalam teks dengan cepat, menghitung relevansi, dan mendukung pencarian teks yang lebih kaya.

### Inverted Index

Secara konseptual:

| Term | Document |
|---|---|
| laptop | 1, 2, 5 |
| gaming | 1, 5 |
| office | 2, 3 |
| keyboard | 3, 5 |

Search engine dapat menemukan document yang mengandung term tanpa memindai seluruh teks satu per satu.

## Simulasi

Buat dataset sederhana:

```json
[
  { "id": 1, "name": "Laptop Gaming", "description": "Laptop untuk gaming" },
  { "id": 2, "name": "Laptop Office", "description": "Laptop untuk pekerjaan kantor" },
  { "id": 3, "name": "Mechanical Keyboard", "description": "Keyboard untuk gaming dan mengetik" }
]
```

Diskusikan:

- Bagaimana pencarian `gaming` menemukan dokumen?
- Apa perbedaan pencarian `Laptop` dan `laptop`?
- Mengapa hasil pencarian perlu relevancy score?
- Apa perbedaan search dengan filter?

## Checklist

- [ ] Bisa menjelaskan Elasticsearch dengan bahasa sendiri.
- [ ] Bisa menjelaskan inverted index.
- [ ] Bisa menjelaskan kapan Elasticsearch lebih tepat dibanding SQL `LIKE`.

---

# Level 1 — Setup Elasticsearch dengan Podman

## Tujuan

Menjalankan Elasticsearch lokal dan memahami konfigurasi dasar container.

## Materi

- [ ] Podman fundamentals.
- [ ] Container, image, volume, network, port.
- [ ] Environment variable.
- [ ] Container logs.
- [ ] Container lifecycle.
- [ ] Persistent storage.
- [ ] Health check.
- [ ] Elasticsearch single-node mode.
- [ ] Elasticsearch security mode untuk development.

## 1. Persiapkan direktori

```bash
mkdir -p elasticsearch-lab
cd elasticsearch-lab

mkdir -p data
```

Untuk lab awal, data dapat disimpan di named volume agar lebih sederhana.

## 2. Buat `compose.yaml`

Contoh single-node development environment. Tag Elasticsearch dan Kibana harus sama.

```yaml
services:
  elasticsearch:
    image: docker.io/library/elasticsearch:8.17.0
    container_name: elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - ES_JAVA_OPTS=-Xms1g -Xmx1g
    ports:
      - "9200:9200"
    volumes:
      - esdata:/usr/share/elasticsearch/data
    networks:
      - elastic-lab
    healthcheck:
      test: ["CMD-SHELL", "curl -fsS http://localhost:9200 >/dev/null || exit 1"]
      interval: 15s
      timeout: 5s
      retries: 10

  kibana:
    image: docker.io/library/kibana:8.17.0
    container_name: kibana
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    ports:
      - "5601:5601"
    depends_on:
      elasticsearch:
        condition: service_healthy
    networks:
      - elastic-lab

volumes:
  esdata:

networks:
  elastic-lab:
```

> Konfigurasi ini khusus local lab dan menonaktifkan security agar pemula mudah mencoba API. Jangan gunakan konfigurasi tersebut untuk lingkungan production atau jaringan publik.

## 3. Jalankan

```bash
podman compose up -d
```

Jika command `podman compose` belum tersedia, install provider Compose yang sesuai dengan OS, atau jalankan menggunakan provider yang sudah terpasang.

Periksa container:

```bash
podman ps
podman compose logs -f elasticsearch
```

## 4. Tes Elasticsearch

```bash
curl http://localhost:9200
```

Tes cluster health:

```bash
curl "http://localhost:9200/_cluster/health?pretty"
```

Tes node:

```bash
curl "http://localhost:9200/_nodes?pretty"
```

Buka Kibana:

- http://localhost:5601

## Lab

- [ ] Start container.
- [ ] Stop Elasticsearch.
- [ ] Start kembali.
- [ ] Restart container.
- [ ] Amati logs.
- [ ] Hapus container tanpa menghapus volume.
- [ ] Jalankan kembali dan verifikasi data tetap ada.
- [ ] Hapus volume dan amati data hilang (gunakan data dummy).

## Perintah Podman

```bash
podman ps
podman images
podman logs elasticsearch
podman inspect elasticsearch
podman stats
podman compose down
podman compose up -d
```

## Checklist

- [ ] Elasticsearch dapat diakses pada port `9200`.
- [ ] Kibana dapat diakses pada port `5601`.
- [ ] Memahami persistent volume.
- [ ] Bisa membaca logs dan status container.

---

# Level 2 — Elasticsearch REST API & CRUD

## Tujuan

Menguasai interaksi Elasticsearch melalui HTTP API.

## Materi

- [ ] HTTP methods: GET, POST, PUT, DELETE.
- [ ] Request body JSON.
- [ ] REST API.
- [ ] Response status.
- [ ] Path dan query parameters.
- [ ] `_cat` APIs.
- [ ] `_cluster` APIs.
- [ ] `_index`, `_id`, `_source`.
- [ ] CRUD document.

## Lab: Index pertama

### Buat index

```http
PUT /products
```

### Tambahkan document

```http
POST /products/_doc
{
  "name": "Mechanical Keyboard",
  "brand": "Keychron",
  "price": 1500000,
  "category": "keyboard",
  "description": "Mechanical keyboard for productivity"
}
```

### Tambahkan document dengan ID

```http
PUT /products/_doc/1001
{
  "name": "Gaming Mouse",
  "brand": "Logitech",
  "price": 750000,
  "category": "mouse"
}
```

### Ambil document

```http
GET /products/_doc/1001
```

### Update document

```http
POST /products/_update/1001
{
  "doc": {
    "price": 700000
  }
}
```

### Delete document

```http
DELETE /products/_doc/1001
```

## Lab: Bulk API

```http
POST /products/_bulk
{"index":{"_id":"p-001"}}
{"name":"Laptop Pro","category":"laptop","price":25000000}
{"index":{"_id":"p-002"}}
{"name":"Gaming Mouse","category":"mouse","price":750000}
{"index":{"_id":"p-003"}}
{"name":"Mechanical Keyboard","category":"keyboard","price":1500000}
```

> Bulk API menggunakan format NDJSON: setiap action dan document berada pada baris tersendiri. Pastikan request diakhiri newline.

## `_cat` API

```http
GET /_cat/indices?v
GET /_cat/nodes?v
GET /_cat/shards?v
GET /_cat/health?v
GET /_cat/allocation?v
```

## Latihan

- [ ] Buat index `employees`.
- [ ] Insert minimal 10 data employee.
- [ ] Retrieve berdasarkan ID.
- [ ] Update nama dan department.
- [ ] Delete satu document.
- [ ] Insert data dengan Bulk API.
- [ ] Tampilkan daftar index menggunakan `_cat/indices`.

## Checklist

- [ ] Menguasai CRUD.
- [ ] Memahami document ID.
- [ ] Memahami Bulk API.
- [ ] Bisa membaca response Elasticsearch.

---

# Level 3 — Index, Mapping & Data Modeling

## Tujuan

Memahami bagaimana Elasticsearch menyimpan dan menginterpretasikan data.

## Materi

- [ ] Index lifecycle.
- [ ] Document structure.
- [ ] Field.
- [ ] Mapping.
- [ ] Dynamic mapping.
- [ ] Explicit mapping.
- [ ] Data types:
  - `text`
  - `keyword`
  - `integer`
  - `long`
  - `float`
  - `double`
  - `boolean`
  - `date`
  - `object`
  - `nested`
  - `ip`
  - `geo_point`
- [ ] Multi-fields.
- [ ] Field naming.
- [ ] Mapping explosion.
- [ ] Reindex API.
- [ ] Alias.

## Lab: Explicit Mapping

```http
PUT /employees
{
  "mappings": {
    "properties": {
      "employee_id": {
        "type": "keyword"
      },
      "full_name": {
        "type": "text",
        "fields": {
          "keyword": {
            "type": "keyword"
          }
        }
      },
      "email": {
        "type": "keyword"
      },
      "department": {
        "type": "keyword"
      },
      "position": {
        "type": "text"
      },
      "salary": {
        "type": "long"
      },
      "is_active": {
        "type": "boolean"
      },
      "join_date": {
        "type": "date"
      }
    }
  }
}
```

## Perbedaan `text` dan `keyword`

| `text` | `keyword` |
|---|---|
| Diproses analyzer | Umumnya disimpan sebagai satu term |
| Cocok untuk full-text | Cocok untuk exact match |
| Search relevancy | Filter, sorting, aggregation |
| Contoh deskripsi | Contoh status, email, department |

## Lab

- [ ] Buat index dengan explicit mapping.
- [ ] Insert document dengan berbagai field.
- [ ] Coba insert tipe data yang tidak sesuai mapping.
- [ ] Amati error response.
- [ ] Periksa mapping menggunakan `GET /index/_mapping`.
- [ ] Buat multi-field untuk nama.
- [ ] Bandingkan query ke `full_name` dan `full_name.keyword`.
- [ ] Buat alias `employees_current`.
- [ ] Simulasikan perubahan mapping dengan index baru dan Reindex API.

## Checklist

- [ ] Bisa memilih tipe field yang tepat.
- [ ] Memahami dynamic vs explicit mapping.
- [ ] Memahami kapan menggunakan `text` dan `keyword`.
- [ ] Memahami mengapa perubahan mapping tertentu membutuhkan reindex.

---

# Level 4 — Query DSL & Search Fundamental

## Tujuan

Menguasai cara mencari dokumen dengan Elasticsearch Query DSL.

## Materi

- [ ] Search API.
- [ ] Query DSL.
- [ ] `match`.
- [ ] `match_all`.
- [ ] `term`.
- [ ] `terms`.
- [ ] `range`.
- [ ] `exists`.
- [ ] `prefix`.
- [ ] `wildcard`.
- [ ] `ids`.
- [ ] `bool`.
- [ ] `must`.
- [ ] `should`.
- [ ] `filter`.
- [ ] `must_not`.
- [ ] Sorting.
- [ ] Pagination.
- [ ] `_source` filtering.
- [ ] Explain API.

## Lab: Basic search

```http
GET /products/_search
{
  "query": {
    "match_all": {}
  }
}
```

## Full-text search

```http
GET /products/_search
{
  "query": {
    "match": {
      "name": "gaming laptop"
    }
  }
}
```

## Exact match

```http
GET /products/_search
{
  "query": {
    "term": {
      "category": "laptop"
    }
  }
}
```

## Range

```http
GET /products/_search
{
  "query": {
    "range": {
      "price": {
        "gte": 1000000,
        "lte": 20000000
      }
    }
  }
}
```

## Bool Query

```http
GET /products/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "name": "laptop"
          }
        }
      ],
      "filter": [
        {
          "term": {
            "category": "laptop"
          }
        },
        {
          "range": {
            "price": {
              "lte": 30000000
            }
          }
        }
      ],
      "must_not": [
        {
          "term": {
            "status": "discontinued"
          }
        }
      ]
    }
  }
}
```

## Sorting dan pagination

```http
GET /products/_search
{
  "query": {
    "match_all": {}
  },
  "sort": [
    {
      "price": "asc"
    }
  ],
  "from": 0,
  "size": 10
}
```

## Latihan

- [ ] Search nama produk.
- [ ] Search multi-field.
- [ ] Filter berdasarkan category.
- [ ] Filter berdasarkan harga.
- [ ] Filter berdasarkan status.
- [ ] Kombinasikan `must`, `filter`, `should`, `must_not`.
- [ ] Sorting harga dan tanggal.
- [ ] Pagination.
- [ ] Gunakan `_source` untuk membatasi field hasil.
- [ ] Gunakan Explain API untuk memahami score.

## Checklist

- [ ] Bisa membangun Query DSL tanpa bantuan.
- [ ] Memahami perbedaan query context dan filter context.
- [ ] Memahami kapan `term` dan `match` digunakan.
- [ ] Bisa membuat query kombinasi.

---

# Level 5 — Advanced Search & Aggregation

## Tujuan

Membangun fitur pencarian yang umum dipakai aplikasi nyata.

## Materi

- [ ] Multi-match query.
- [ ] Boosting.
- [ ] Phrase search.
- [ ] `match_phrase`.
- [ ] Fuzzy search.
- [ ] Search highlighting.
- [ ] Aggregation.
- [ ] Metric aggregation.
- [ ] Bucket aggregation.
- [ ] Terms aggregation.
- [ ] Date histogram.
- [ ] Nested query.
- [ ] Nested aggregation.
- [ ] Search templates.
- [ ] Suggesters.
- [ ] Autocomplete.
- [ ] Faceted search.

## Lab: Multi-field search

```http
GET /products/_search
{
  "query": {
    "multi_match": {
      "query": "gaming laptop",
      "fields": [
        "name^3",
        "brand^2",
        "description"
      ],
      "type": "best_fields"
    }
  }
}
```

## Lab: Highlight

```http
GET /products/_search
{
  "query": {
    "match": {
      "description": "gaming"
    }
  },
  "highlight": {
    "fields": {
      "description": {}
    }
  }
}
```

## Lab: Aggregation

```http
GET /products/_search
{
  "size": 0,
  "aggs": {
    "by_category": {
      "terms": {
        "field": "category"
      }
    },
    "average_price": {
      "avg": {
        "field": "price"
      }
    },
    "price_range": {
      "range": {
        "field": "price",
        "ranges": [
          { "to": 1000000 },
          { "from": 1000000, "to": 5000000 },
          { "from": 5000000 }
        ]
      }
    }
  }
}
```

## Lab: Faceted search

Buat pencarian katalog yang dapat menampilkan:

- Total produk yang ditemukan.
- Filter kategori.
- Filter brand.
- Rentang harga.
- Sorting harga.
- Highlight nama/deskripsi.
- Pagination.

## Lab: Nested data

Buat data order:

```json
{
  "order_id": "ORD-1001",
  "customer": "Asep",
  "items": [
    { "product_id": "P-1", "name": "Laptop", "qty": 1, "price": 10000000 },
    { "product_id": "P-2", "name": "Mouse", "qty": 2, "price": 500000 }
  ]
}
```

Pelajari:

- [ ] Perbedaan `object` dan `nested`.
- [ ] Kapan nested diperlukan.
- [ ] Nested query.
- [ ] Nested aggregation.
- [ ] Trade-off performa nested field.

## Checklist

- [ ] Bisa membuat search multi-field.
- [ ] Bisa mengatur boost.
- [ ] Bisa menampilkan highlight.
- [ ] Bisa membuat aggregation.
- [ ] Bisa membangun faceted search.
- [ ] Memahami nested query.

---

# Level 6 — Analyzer & Text Processing

## Tujuan

Memahami bagaimana teks diubah menjadi term saat indexing dan searching.

## Materi

- [ ] Character filters.
- [ ] Tokenizer.
- [ ] Token filters.
- [ ] Analyzer.
- [ ] Standard analyzer.
- [ ] Simple analyzer.
- [ ] Whitespace analyzer.
- [ ] Keyword analyzer.
- [ ] Lowercase filter.
- [ ] Stop words.
- [ ] Stemming.
- [ ] Synonym.
- [ ] Custom analyzer.
- [ ] Language analyzer.
- [ ] Normalizer.
- [ ] `_analyze` API.

## Lab: Analyze API

```http
POST /_analyze
{
  "analyzer": "standard",
  "text": "Elasticsearch is a powerful Search Engine"
}
```

Bandingkan analyzer:

```http
POST /_analyze
{
  "analyzer": "whitespace",
  "text": "Elasticsearch is a powerful Search Engine"
}
```

## Lab: Custom analyzer

```http
PUT /articles
{
  "settings": {
    "analysis": {
      "analyzer": {
        "custom_text_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": [
            "lowercase"
          ]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "title": {
        "type": "text",
        "analyzer": "custom_text_analyzer"
      }
    }
  }
}
```

## Lab Bahasa Indonesia

- [ ] Uji teks Bahasa Indonesia.
- [ ] Bandingkan token untuk kata berimbuhan.
- [ ] Evaluasi stemming.
- [ ] Uji stop words.
- [ ] Uji synonym.
- [ ] Buat analyzer khusus untuk kebutuhan search aplikasi.
- [ ] Evaluasi hasil analyzer menggunakan `_analyze`.

> Analyzer bahasa tidak otomatis cocok untuk semua kebutuhan. Uji kualitas pencarian menggunakan contoh query dan dokumen nyata yang sudah dianonimkan.

## Checklist

- [ ] Bisa menjelaskan alur character filter → tokenizer → token filter.
- [ ] Bisa membuat custom analyzer.
- [ ] Bisa mengevaluasi hasil tokenization.
- [ ] Memahami analyzer saat indexing dan search.

---

# Level 7 — Cluster, Sharding & Distributed Architecture

## Tujuan

Memahami Elasticsearch sebagai distributed system.

## Materi

- [ ] Cluster.
- [ ] Node.
- [ ] Node roles.
- [ ] Master-eligible node.
- [ ] Data node.
- [ ] Ingest node.
- [ ] Coordinating node.
- [ ] Shard.
- [ ] Primary shard.
- [ ] Replica shard.
- [ ] Cluster state.
- [ ] Cluster health.
- [ ] Allocation.
- [ ] Discovery.
- [ ] Replication.
- [ ] Failover.
- [ ] Split brain (konsep dan pencegahannya).
- [ ] Cluster routing.
- [ ] Index templates.
- [ ] Component templates.
- [ ] Data streams.

## Cluster health

```http
GET /_cluster/health?pretty
```

Status:

- `green`: primary dan replica shard tersedia.
- `yellow`: primary shard tersedia, tetapi replica belum seluruhnya dialokasikan.
- `red`: ada primary shard yang tidak tersedia.

## Lab: Multi-node cluster

Buat simulasi tiga node Elasticsearch dengan Podman Compose.

Catatan lab:

- Untuk belajar cluster formation, gunakan konfigurasi discovery yang sesuai dokumentasi versi yang digunakan.
- Atur node name dan discovery seed.
- Atur initial master nodes hanya saat bootstrap cluster baru; jangan asal mengubahnya pada cluster yang sudah terbentuk.
- Untuk lab lokal, perhatikan kebutuhan memory dan pengaturan kernel host.
- Multi-node local lab bisa mengonsumsi RAM cukup besar. Mulai dengan dua node, lalu tambah node ketiga jika resource memadai.
- Konfigurasi security/TLS production perlu dipelajari sebelum mengekspos cluster.

## Latihan

- [ ] Jalankan 2 node.
- [ ] Periksa daftar node.
- [ ] Buat index dengan primary dan replica.
- [ ] Periksa shard allocation.
- [ ] Stop salah satu node.
- [ ] Amati cluster health.
- [ ] Start kembali node.
- [ ] Amati recovery.
- [ ] Tambahkan node ketiga.
- [ ] Pelajari allocation explain.
- [ ] Buat index template.
- [ ] Buat alias untuk proses rolling index.

## API yang dipelajari

```http
GET /_cluster/health
GET /_cat/nodes?v
GET /_cat/shards?v
GET /_cat/indices?v
GET /_cluster/allocation/explain
GET /_nodes/stats
```

## Checklist

- [ ] Memahami primary dan replica.
- [ ] Memahami cluster health.
- [ ] Bisa menjelaskan shard allocation.
- [ ] Memahami failover.
- [ ] Bisa menganalisis node dan shard.

---

# Level 8 — Performance, Security & Reliability

## Tujuan

Mempersiapkan Elasticsearch untuk penggunaan yang stabil dan aman.

## A. Performance

Materi:

- [ ] JVM heap.
- [ ] Memory pressure.
- [ ] Disk I/O.
- [ ] CPU utilization.
- [ ] Indexing throughput.
- [ ] Bulk indexing.
- [ ] Refresh interval.
- [ ] Translog.
- [ ] Segment.
- [ ] Merge.
- [ ] Query cache.
- [ ] Request cache.
- [ ] Field data.
- [ ] Cardinality.
- [ ] Shard sizing.
- [ ] Hotspot.
- [ ] Slow logs.
- [ ] Search profiling.
- [ ] Benchmark.

Lab:

- [ ] Index 1.000 dokumen.
- [ ] Index 10.000 dokumen.
- [ ] Bandingkan single insert vs bulk.
- [ ] Uji ukuran bulk berbeda.
- [ ] Uji refresh interval.
- [ ] Bandingkan query tanpa filter dan query dengan filter.
- [ ] Gunakan Profile API.
- [ ] Periksa slow logs.
- [ ] Monitor container dengan `podman stats`.
- [ ] Catat hasil benchmark.

## B. Pagination

Pelajari:

- [ ] `from` dan `size`.
- [ ] Batas pagination dalam.
- [ ] `search_after`.
- [ ] Sort yang stabil.
- [ ] Point in Time (PIT).
- [ ] Scroll API untuk use case yang sesuai, terutama ekstraksi/batch, bukan sebagai pilihan default untuk pagination aplikasi.

Lab:

- Implementasikan pagination 10 item.
- Simulasikan page besar.
- Bandingkan `from/size` dengan `search_after`.
- Implementasikan cursor pagination.

## C. Security

Materi:

- [ ] Security features.
- [ ] Authentication.
- [ ] User.
- [ ] Role.
- [ ] Role-based access control.
- [ ] Index privileges.
- [ ] TLS.
- [ ] HTTPS.
- [ ] Certificate.
- [ ] API key.
- [ ] Secrets management.
- [ ] Network isolation.
- [ ] Audit logging.
- [ ] Security hardening.

Lab:

- [ ] Aktifkan security pada lab terpisah.
- [ ] Konfigurasi user.
- [ ] Buat role read-only.
- [ ] Buat role untuk index tertentu.
- [ ] Tes API key.
- [ ] Uji request tanpa credential.
- [ ] Uji HTTPS.
- [ ] Jangan commit credential ke Git.

> Jangan mematikan security untuk cluster yang bisa diakses dari jaringan selain host lab.

## D. Backup & Restore

Materi:

- [ ] Snapshot.
- [ ] Snapshot repository.
- [ ] Restore.
- [ ] Repository verification.
- [ ] Disaster recovery.
- [ ] Backup policy.
- [ ] RPO dan RTO.

Lab:

- [ ] Konfigurasi snapshot repository.
- [ ] Snapshot index.
- [ ] Hapus index latihan.
- [ ] Restore snapshot.
- [ ] Verifikasi data.
- [ ] Dokumentasikan prosedur recovery.

## Checklist

- [ ] Bisa melakukan benchmark dasar.
- [ ] Memahami pagination yang scalable.
- [ ] Bisa membuat role dan API key.
- [ ] Memahami TLS.
- [ ] Bisa membuat snapshot dan restore.

---

# Level 9 — Integrasi Backend & Production Simulation

## Tujuan

Menggunakan Elasticsearch sebagai search service untuk aplikasi.

## Materi

- [ ] Backend-to-Elasticsearch communication.
- [ ] HTTP client.
- [ ] Connection pooling.
- [ ] Timeout.
- [ ] Retry.
- [ ] Error handling.
- [ ] Bulk ingestion.
- [ ] Data synchronization.
- [ ] Database sebagai source of truth.
- [ ] Search index sebagai derived data.
- [ ] Event-driven indexing.
- [ ] Outbox pattern (konsep).
- [ ] Idempotency.
- [ ] Reconciliation.
- [ ] Mapping versioning.
- [ ] Index alias.
- [ ] Reindex migration.
- [ ] Observability.
- [ ] Health check.

## Arsitektur Simulasi

```text
                  ┌─────────────────┐
                  │   Frontend UI   │
                  └────────┬────────┘
                           │ HTTP
                  ┌────────▼────────┐
                  │  Backend API    │
                  └──────┬─────┬────┘
                         │     │
             CRUD/Search│     │Write source data
                         │     ▼
                ┌────────▼──┐ ┌────────────┐
                │Elasticsearch│ │ Database   │
                │ Search Index│ │ Source DB  │
                └─────────────┘ └────────────┘
```

## Pilihan backend lab

Gunakan bahasa yang sudah familiar:

- Go.
- Java.
- JavaScript/Node.js.
- Python.

## Fitur API yang dibuat

```text
GET    /products
GET    /products/:id
POST   /products
PUT    /products/:id
DELETE /products/:id

GET    /search?q=keyword
GET    /search?category=laptop
GET    /search?min_price=1000000&max_price=5000000
GET    /search?sort=price_asc
GET    /search?brand=...
```

## Latihan Integrasi

- [ ] Buat API insert product.
- [ ] Index product ke Elasticsearch.
- [ ] Buat endpoint full-text search.
- [ ] Implementasikan filter.
- [ ] Implementasikan sorting.
- [ ] Implementasikan pagination.
- [ ] Implementasikan aggregation kategori.
- [ ] Implementasikan autocomplete.
- [ ] Tambahkan timeout.
- [ ] Tambahkan error handling.
- [ ] Tambahkan retry dengan batas yang aman.
- [ ] Buat health check backend dan Elasticsearch.
- [ ] Sinkronkan perubahan data.
- [ ] Simulasikan Elasticsearch unavailable.
- [ ] Pastikan aplikasi menangani kegagalan search service.

## Checklist

- [ ] Backend dapat menggunakan Elasticsearch.
- [ ] API search bekerja.
- [ ] Ada timeout dan error handling.
- [ ] Memahami data synchronization.
- [ ] Memahami Elasticsearch bukan pengganti source-of-truth database secara otomatis.

---

# Level 10 — Capstone Project

## Project: Product Search & Discovery Platform

Bangun sistem pencarian katalog produk yang menyerupai search pada e-commerce.

## Arsitektur

```text
┌────────────────┐
│ Web Frontend   │
└───────┬────────┘
        │
┌───────▼────────┐
│ Backend API    │
└──┬───────────┬─┘
   │           │
   │           ├──────────────────┐
   ▼           ▼                  ▼
┌──────────┐ ┌──────────────┐ ┌───────────┐
│Database  │ │Elasticsearch │ │  Kibana   │
│Source DB │ │Search Engine │ │ Dashboard │
└──────────┘ └──────────────┘ └───────────┘
```

## Fitur

### Product Catalog

- [ ] Product ID.
- [ ] Product name.
- [ ] Description.
- [ ] Category.
- [ ] Brand.
- [ ] Price.
- [ ] Stock.
- [ ] Status.
- [ ] Tags.
- [ ] Created date.
- [ ] Rating.

### Search

- [ ] Full-text search.
- [ ] Multi-field search.
- [ ] Search relevancy.
- [ ] Fuzzy search.
- [ ] Highlight.
- [ ] Autocomplete.
- [ ] Synonym.
- [ ] Typo tolerance.

### Filtering

- [ ] Category.
- [ ] Brand.
- [ ] Price range.
- [ ] Rating.
- [ ] Availability.
- [ ] Tags.

### Sorting

- [ ] Price ascending.
- [ ] Price descending.
- [ ] Rating.
- [ ] Newest.
- [ ] Relevancy.

### Analytics

- [ ] Product count per category.
- [ ] Average price.
- [ ] Price histogram.
- [ ] Popular brand.
- [ ] Search result distribution.

### Operational

- [ ] Podman Compose.
- [ ] Persistent storage.
- [ ] Health check.
- [ ] Logging.
- [ ] Monitoring.
- [ ] Security.
- [ ] Backup.
- [ ] Restore.
- [ ] Documentation.
- [ ] Load testing.

## Definition of Done

- [ ] Semua container dapat dijalankan melalui satu perintah.
- [ ] Data tidak hilang saat container restart.
- [ ] Index memiliki mapping yang eksplisit.
- [ ] Search endpoint mendukung query, filter, sort, dan pagination.
- [ ] Aggregation bekerja.
- [ ] Ada error handling ketika Elasticsearch down.
- [ ] Ada dokumentasi API.
- [ ] Ada dokumentasi setup.
- [ ] Ada backup/restore procedure.
- [ ] Ada benchmark sederhana.
- [ ] Project dapat dijalankan ulang dari repository yang bersih.

---

# Rencana Belajar 8 Minggu

| Minggu | Fokus | Hasil |
|---|---|---|
| 1 | Fundamental + Podman | Elasticsearch single-node berjalan |
| 2 | REST API + CRUD | Bisa mengelola data melalui API |
| 3 | Mapping + data modeling | Index dengan mapping yang benar |
| 4 | Query DSL | Search dan filter |
| 5 | Advanced search + aggregation | Search katalog dengan faceting |
| 6 | Analyzer + cluster | Custom analyzer dan multi-node lab |
| 7 | Performance + security + backup | Benchmark, security, snapshot |
| 8 | Backend integration + capstone | Aplikasi product search |

> Pace fleksibel. Jika konsep cluster atau analyzer terasa sulit, ulangi lab sebelum melanjutkan.

---

# Struktur Folder Lab

```text
elasticsearch-roadmap/
├── compose.yaml
├── README.md
├── .env.example
├── data/
│   └── sample/
├── requests/
│   ├── 01-cluster.http
│   ├── 02-crud.http
│   ├── 03-mapping.http
│   ├── 04-query-dsl.http
│   ├── 05-aggregation.http
│   └── 06-analyzer.http
├── scripts/
│   ├── setup.sh
│   ├── seed-data.sh
│   └── cleanup.sh
├── backend/
└── docs/
    ├── architecture.md
    ├── benchmark.md
    └── backup-restore.md
```

---

# Cheat Sheet Elasticsearch

## Cluster

```http
GET /
GET /_cluster/health
GET /_cat/nodes?v
GET /_cat/indices?v
GET /_cat/shards?v
```

## Index

```http
PUT /my-index
GET /my-index
GET /my-index/_mapping
DELETE /my-index
```

## Document

```http
POST /my-index/_doc
GET /my-index/_doc/1
PUT /my-index/_doc/1
POST /my-index/_update/1
DELETE /my-index/_doc/1
```

## Search

```http
GET /my-index/_search
GET /my-index/_search?q=keyword
```

## Bulk

```http
POST /_bulk
```

## Analyze

```http
POST /_analyze
```

## Reindex

```http
POST /_reindex
```

## Snapshot

```http
PUT /_snapshot/my_repository
PUT /_snapshot/my_repository/snapshot_1
GET /_snapshot/my_repository/snapshot_1
POST /_snapshot/my_repository/snapshot_1/_restore
```

---

# Referensi Belajar

Utamakan dokumentasi resmi untuk API, fitur, dan kesesuaian versi:

- Elasticsearch Guide: https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html
- Elasticsearch REST APIs: https://www.elastic.co/docs/api/doc/elasticsearch
- Query DSL: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html
- Mapping: https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping.html
- Aggregations: https://www.elastic.co/guide/en/elasticsearch/reference/current/aggregations.html
- Analysis: https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis.html
- Docker/Container deployment: https://www.elastic.co/guide/en/elasticsearch/reference/current/docker.html
- Podman Documentation: https://podman.io/docs

---

# Metode Belajar

Untuk setiap level, gunakan siklus berikut:

1. **Pelajari konsep** — pahami mengapa fitur tersebut dibutuhkan.
2. **Simulasikan** — jalankan lab melalui Podman.
3. **Eksperimen** — ubah konfigurasi atau query dan amati hasil.
4. **Troubleshoot** — sengaja buat error untuk belajar membaca response.
5. **Dokumentasikan** — catat API, hasil, dan insight.
6. **Review** — ulangi latihan tanpa melihat tutorial.

## Template Catatan Lab

```markdown
# Lab: [Nama Lab]

## Tujuan
Apa yang ingin dipelajari?

## Environment
- Podman:
- Elasticsearch:
- Kibana:

## Langkah
1.
2.
3.

## Request
```http
GET /...
```

## Hasil
Apa yang terjadi?

## Error / Troubleshooting
Apa error yang muncul dan bagaimana mengatasinya?

## Kesimpulan
Apa yang sudah dipahami?

## Tantangan
Apa yang bisa dicoba selanjutnya?
```

---

# Final Checklist — Kompetensi Mahir

## Fundamental

- [ ] Memahami inverted index.
- [ ] Memahami relevancy.
- [ ] Memahami search engine vs database.

## Operations

- [ ] Menjalankan Elasticsearch dengan Podman.
- [ ] Mengelola container dan volume.
- [ ] Membaca logs dan health.

## Data

- [ ] CRUD.
- [ ] Bulk API.
- [ ] Mapping.
- [ ] Data types.
- [ ] Reindex.
- [ ] Alias.

## Search

- [ ] Query DSL.
- [ ] Bool query.
- [ ] Full-text search.
- [ ] Exact match.
- [ ] Range filter.
- [ ] Multi-field search.
- [ ] Fuzzy.
- [ ] Highlight.
- [ ] Pagination.
- [ ] Aggregation.
- [ ] Nested query.

## Text

- [ ] Analyzer.
- [ ] Tokenizer.
- [ ] Token filter.
- [ ] Custom analyzer.
- [ ] Synonym.
- [ ] Language-specific text analysis.

## Distributed System

- [ ] Cluster.
- [ ] Node.
- [ ] Primary shard.
- [ ] Replica shard.
- [ ] Cluster health.
- [ ] Allocation.
- [ ] Failover.
- [ ] Recovery.

## Production

- [ ] Performance tuning.
- [ ] Benchmark.
- [ ] Security.
- [ ] TLS.
- [ ] API key.
- [ ] Snapshot.
- [ ] Restore.
- [ ] Monitoring.
- [ ] Troubleshooting.
- [ ] Backend integration.

---

## Saran Urutan Penguasaan

Jangan terburu-buru masuk cluster multi-node. Pastikan kamu benar-benar memahami **mapping, Query DSL, analyzer, dan aggregation** terlebih dahulu. Empat area tersebut paling sering menjadi fondasi ketika Elasticsearch digunakan pada aplikasi nyata.

Setelah single-node lab dan capstone selesai, ulangi capstone dengan cluster multi-node, security aktif, serta simulasi node failure. Di tahap itu kamu mulai berlatih sebagai Elasticsearch operator, bukan hanya pengguna API.
