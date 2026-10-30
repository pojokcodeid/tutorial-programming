# 🧭 Bab: Dasar RESTful API

> **Untuk siapa:** pemula total yang baru mengenal dunia backend dan API.
> **Sifat:** materi dasar berdiri sendiri — tidak perlu sudah bisa bahasa pemrograman.
> **Jumlah:** 15 pelajaran + 40 soal kuis.
> **Estimasi:** ± 3 menit baca + latihan per pelajaran → sekitar 1–2 minggu belajar santai.
> **Sumber rujukan:** [roadmap-belajar-restful-api.md](../../roadmap-belajar-restful-api.md) — Fase 1 sampai Fase 3.

---

## Apa yang akan kamu bisa setelah bab ini?

1. Menjelaskan apa itu API dan REST dengan bahasa sendiri memakai analogi sehari-hari.
2. Membaca satu percakapan web (request–response) tanpa bingung: method, URL, header, body, status code.
3. Membaca data JSON tanpa pusing.
4. Tahu kapan pakai GET, POST, PUT, PATCH, DELETE — dan kapan status 201, 404, atau 500.
5. Menilai sebuah endpoint "sudah REST atau belum".
6. Mencoba API sungguhan lewat Postman/curl, lalu memanggil API dari kode program.

---

## Peta 15 Pelajaran

| # | Pelajaran | Inti yang dipelajari |
|---|-----------|----------------------|
| 1 | [Apa Itu API?](01-apa-itu-api.md) | API = perantara resmi dua program; analogi restoran |
| 2 | [Client, Server, Request, Response](02-client-server-request-response.md) | Anatomi percakapan web; DevTools |
| 3 | [URL & Endpoint](03-url-endpoint.md) | Alamat rumah untuk data |
| 4 | [HTTP Method](04-http-method.md) | GET, POST, PUT, PATCH, DELETE = operasi CRUD |
| 5 | [Status Code](05-status-code.md) | Kode balasan: 2xx, 4xx, 5xx |
| 6 | [Mengenal JSON](06-json.md) | Bahasa data web modern |
| 7 | [Path, Query, Body](07-path-query-body.md) | Di mana data harus diletakkan |
| 8 | [HTTP Headers](08-http-headers.md) | Amplop yang menyimpan instruksi |
| 9 | [Apa Itu REST?](09-apa-itu-rest.md) | 6 prinsip REST dengan bahasa sederhana |
| 10 | [Merancang Endpoint](10-merancang-endpoint.md) | Penamaan URL yang enak dibaca |
| 11 | [Format Response & Error](11-format-response-error.md) | Bentuk respons yang konsisten |
| 12 | [Safe & Idempotent](12-safe-idempotent.md) | Kesalahan desain yang sering terjadi |
| 13 | [Mencoba API: Postman & cURL](13-postman-curl.md) | Panggil API tanpa menulis program |
| 14 | [Memanggil API dari Program](14-panggil-api-dari-kode.md) | Fetch, Axios, requests |
| 15 | [Proyek Mini & Rangkuman](15-proyek-mini-rangkuman.md) | Proyek akhir + langkah berikutnya |

Setelahnya: **[Kuis 40 Soal](kuis-40-soal.md)** untuk mengukur pemahamanmu.

---

## Urutan Belajar

- **Minggu 1:** Pelajaran 1–5 (fondasi: apa itu API → status code)
- **Minggu 2:** Pelajaran 6–8 (JSON, penempatan data, header)
- **Minggu 3:** Pelajaran 9–12 (inti REST & desain endpoint)
- **Minggu 4:** Pelajaran 13–15 + kuis (praktik & proyek)

> 💡 Kerjakan berurutan. Tiap pelajaran memakai konsep dari pelajaran sebelumnya, dan tiap pelajaran ditutup dengan **rangkuman** + **latihan kecil** yang bisa selesai kurang dari 10 menit.

---

## Prasyarat

- Punya browser modern (Chrome/Firefox/Edge/Safari).
- Berani membuka terminal/Command Prompt untuk satu-dua perintah (akan dijelaskan langkah demi langkah).
- **Tidak perlu** sudah bisa bahasa pemrograman — pelajaran 1–12 murni konsep.

---

## Pemetaan ke Roadmap

| Fase di roadmap | Pelajaran di bab ini |
|-----------------|----------------------|
| Fase 1 — Fundamental Web & HTTP | 2, 3, 4, 5, 6, 7, 8 |
| Fase 2 — Konsep REST | 1, 9, 10, 11, 12 |
| Fase 3 — Konsumsi API | 13, 14 |
| Fase 4 — Membangun API (pengantar) | 15 (proyek mini) |

> **Catatan:** pembahasan HTTP yang lebih mendalam (cookie, cache, CORS, HTTPS, HTTP/2) ada di materi [HTTP](../../http.md). Bab ini hanya mengambil kunci dasarnya, tanpa mengulang.

---

## Rujukan

- [REST API Tutorial — restfulapi.net](https://restfulapi.net/)
- [MDN Web Docs — HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP)
- [JSONPlaceholder](https://jsonplaceholder.typicode.com/) · [PokéAPI](https://pokeapi.co/) · [ReqRes](https://reqres.in/)
- [Postman Learning Center](https://learning.postman.com/)
