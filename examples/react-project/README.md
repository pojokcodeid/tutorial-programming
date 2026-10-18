# Contoh Project React — Dashboard Toko

Proyek React lengkap yang menjadi **contoh praktis materi tutorial "Contoh Project
React JS"**. Satu aplikasi nyata yang memuat seluruh topik materi:

| Topik | Berkas |
| --- | --- |
| Custom component | `src/components/*.jsx` |
| Routing (React Router DOM) | `src/App.jsx`, `src/components/ProtectedRoute.jsx` |
| Context API | `src/auth/AuthContext.jsx` |
| Axios + interceptor | `src/api/client.js` |
| Authentication & authorization | `src/pages/Login.jsx`, `src/components/RoleGate.jsx`, `server.js` |
| json-server sebagai dummy backend | `server.js`, `db.json` |
| Auto access & refresh token | `src/api/client.js`, endpoint `/auth/refresh` |
| Component library Ant Design | seluruh halaman di `src/pages/` |

## Menjalankan

Butuh Node.js 18+. Buka **dua terminal** di folder ini:

```bash
# terminal 1 — backend dummy (json-server + JWT)
npm install
npm run server          # → http://localhost:3001

# terminal 2 — frontend React (Vite)
npm run dev             # → http://localhost:5173
```

### Akun bawaan

| Peran | Username | Password |
| --- | --- | --- |
| admin | `admin` | `admin123` |
| user | `budi` | `budi123` |

Daftar akun baru lewat halaman **Register** (peran selalu `user`).

## Struktur folder

```
react-project/
├── db.json                # data dummy: users, products, refreshTokens
├── server.js              # json-server + endpoint auth JWT buatan sendiri
├── vite.config.js
├── index.html
└── src/
    ├── main.jsx           # inject React + ConfigProvider + App antd
    ├── App.jsx            # peta rute seluruh aplikasi
    ├── styles.css
    ├── api/
    │   ├── client.js      # instance axios + interceptor refresh token
    │   ├── authApi.js     # login / register / me / logout
    │   ├── productApi.js  # CRUD produk
    │   └── userApi.js     # daftar & hapus user (admin)
    ├── auth/
    │   ├── token.js       # simpan/hapus token di localStorage
    │   └── AuthContext.jsx# Context API: user, login, logout
    ├── components/        # komponen kustom buatan sendiri
    │   ├── AppShell.jsx     # layout: sidebar + header
    │   ├── PageHeader.jsx   # judul halaman + tombol aksi
    │   ├── StatCard.jsx     # kartu statistik dashboard
    │   ├── ProductTable.jsx # tabel produk (wrapper Table Ant Design)
    │   ├── ProtectedRoute.jsx # penjaga rute (wajib login)
    │   └── RoleGate.jsx     # penjaga peran (otorisasi)
    └── pages/
        ├── Login.jsx / Register.jsx
        ├── Dashboard.jsx
        ├── Products.jsx / ProductForm.jsx
        ├── Users.jsx        # khusus admin
        └── NotFound.jsx
```

## Endpoint API

| Method | Route | Keterangan |
| --- | --- | --- |
| POST | `/auth/register` | buat akun → `{ accessToken, refreshToken, user }` |
| POST | `/auth/login` | masuk → `{ accessToken, refreshToken, user }` |
| POST | `/auth/refresh` | tukar refresh token baru (rotasi) → token baru |
| POST | `/auth/logout` | cabut refresh token |
| GET | `/auth/me` | profil pemegang access token |
| GET | `/products` | publik (baca) |
| POST/PUT/PATCH/DELETE | `/products…` | wajib login; hapus/ubah hanya admin atau pemilik |
| GET | `/users` | khusus admin |
| — | `/refreshTokens` | ditutup (404), data internal |

Access token hidup **1 menit** (`ACCESS_TTL`) supaya perilaku refresh mudah diamati;
refresh token hidup **7 hari** dan **dirotasi** setiap dipakai. Ubah lewat variabel
lingkungan `ACCESS_TTL`, `REFRESH_TTL`, dan `JWT_SECRET` (wajib diganti di produksi).

## Catatan keamanan (untuk belajar, bukan produksi)

- Secret JWT ditulis hard-coded sebagai nilai bawaan — produksi wajib dari variabel lingkungan.
- Access & refresh token disimpan di `localStorage` (rentan XSS); pola produksi umumnya
  menyimpan refresh token di cookie `httpOnly`.
- json-server menulis `db.json` apa adanya — bukan database sungguhan.
- Password di-hash dengan `scrypt` bawaan Node (tanpa library tambahan). Untuk membuat
  hash password baru: `node -e "const{scryptSync,randomBytes}=require('crypto');const s=randomBytes(16).toString('hex');console.log(s+':'+scryptSync('passwordmu',s,64).toString('hex'))"`.
