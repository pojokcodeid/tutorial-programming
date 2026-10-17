# Framework MVC Lucee CFML

Proyek contoh nyata untuk materi tutorial **Membuat Framework MVC Lucee CFML** —
framework MVC ringan buatan sendiri (front controller + routing + controller +
model + view) di atas **Lucee 7** dan **CommandBox**.

Adaptasi dari [pojokcodeid/cfml-mvc-framework](https://github.com/pojokcodeid/cfml-mvc-framework)
dengan perubahan utama: **konfigurasi dibaca dari file `.env`**, bukan dari
`configs/global.json`.

## Fitur

- **Konfigurasi `.env`** — datasource, baseURL, debug, dan folder upload dibaca
  dari `.env` lewat parser buatan sendiri (`core/Env.cfc`). Kredensial tidak
  pernah ikut ter-commit ke git.
- **Front controller + URL rewrite** — semua request diarahkan ke `index.cfm`
  lalu dicocokkan oleh mesin routing `core/App.cfc`.
- **Routing berparameter** — mis. `/employee/edit/:id` menangkap `id` dan
  meneruskannya sebagai argument method controller.
- **BaseController** — helper `view()`, `model()`, `redirect()`, `upload()`,
  dan `env()`.
- **Validasi input** bergaya Laravel: `"required|is_email|max:50"`.
- **Flash message** lewat session untuk umpan balik setelah aksi.
- **CRUD lengkap** contoh modul Employee dengan upload lampiran (nama UUID).

## Struktur Proyek

```
cfml-mvc-framework/
├── .env.example              # contoh konfigurasi — salin jadi .env
├── box.json                  # metadata proyek CommandBox
├── server.json               # konfigurasi server (webroot src, port 8888, rewrite)
├── customRewrites.xml        # aturan URL rewrite → index.cfm?page=$1
├── migrations/001_init.sql   # skema tabel personal
├── tests/employee_test.http  # uji route dengan REST Client / VS Code REST Client
└── src/                      # webroot
    ├── Application.cfc       # muat .env → this.datasources, application scope
    ├── index.cfm             # front controller (semua request masuk sini)
    ├── core/
    │   ├── Env.cfc           # parser file .env
    │   ├── App.cfc           # mesin routing
    │   ├── Router.cfc        # daftar route
    │   ├── BaseController.cfc
    │   ├── Message.cfc       # flash message
    │   └── Validation.cfc    # validasi input
    ├── controllers/
    │   ├── Default.cfc
    │   └── em/EmployeeController.cfc
    ├── models/em/EmployeeModel.cfc
    ├── views/
    │   ├── templates/header.cfm, footer.cfm
    │   └── emp/index.cfm, add.cfm, edit.cfm
    └── public/uploads/       # tujuan upload lampiran
```

## Prasyarat

- [CommandBox](https://www.ortussolutions.com/products/commandbox) (menyertakan JVM)
- MariaDB / MySQL berjalan di `127.0.0.1:3306`

## Cara Menjalankan

```bash
# 1. Salin konfigurasi lalu sesuaikan kredensial DB
cp .env.example .env

# 2. Buat database & jalankan migrasi
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS latihan"
mysql -u root -p latihan < migrations/001_init.sql

# 3. Nyalakan server Lucee (webroot: src, port 8888)
box server start

# 4. Buka aplikasi
open http://localhost:8888/employee
```

Setiap kali mengubah `.env`, jalankan `box server restart` agar nilai baru
terbaca kembali oleh `Application.cfc`.

## Konfigurasi via .env

| Key                | Fungsi                                        |
| ------------------ | --------------------------------------------- |
| `APP_NAME`         | Nama aplikasi = `this.name` Application.cfc   |
| `APP_URL`          | URL dasar untuk link & redirect               |
| `APP_DEBUG`        | `true` menampilkan detail error di browser    |
| `DB_DRIVER_CLASS`  | Class JDBC driver (`org.mariadb.jdbc.Driver`) |
| `DB_TYPE`          | Jenis koneksi (`mariadb` / `mysql`)           |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Koneksi database |
| `DB_CONNECTION_LIMIT` | Ukuran connection pool                     |
| `UPLOAD_DIR`       | Folder upload (relatif terhadap webroot)      |

## Menguji Route

Buka `tests/employee_test.http` dengan REST Client (VS Code / JetBrains) atau
Insomnia, lalu jalankan request satu per satu.

## Referensi

- [pojokcodeid/cfml-mvc-framework](https://github.com/pojokcodeid/cfml-mvc-framework)
- [Dokumentasi Lucee](https://docs.lucee.org/)
- [CommandBox Book](https://commandbox.ortusbooks.com/)
