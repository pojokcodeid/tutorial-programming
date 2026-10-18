/* ============================================================
   server.js — dummy backend REST untuk contoh project React
   json-server (CRUD gratis) + endpoint auth JWT buatan sendiri.
   Jalankan:  npm run server   →  http://localhost:3001
   ============================================================ */
import jsonServer from 'json-server';
import jwt from 'jsonwebtoken';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const { create, defaults, router, bodyParser } = jsonServer;

/* ---------- 1. Konfigurasi ---------- */
const PORT = process.env.PORT || 3001;
const SECRET = process.env.JWT_SECRET || 'rahasia-contoh-ganti-di-produksi';
const ACCESS_TTL = process.env.ACCESS_TTL || '1m';      // access token sengaja pendek agar mudah diamati
const REFRESH_TTL = process.env.REFRESH_TTL || '7d';    // refresh token panjang
const REFRESH_MS = 7 * 24 * 60 * 60 * 1000;             // masa hidup refresh token (ms)

const server = create();
const api = router('db.json');   // CRUD otomatis untuk users, products, dll.
const db = api.db;               // akses isi db.json (lowdb) dari kode kita

/* middleware bawaan: CORS, logger, kompresi — plus pembaca body JSON
   (defaults() tidak memuat body parser, jadi kita pasang sendiri) */
server.use(defaults());
server.use(bodyParser);

/* ---------- 2. Hash password tanpa library tambahan ---------- */
function hashPassword(plain) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(plain, salt, 64).toString('hex')}`;
}

function checkPassword(plain, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const test = scryptSync(plain, salt, 64).toString('hex');
  return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(test, 'hex'));
}

/* ---------- 3. Penerbitan token ---------- */
function issueTokens(user) {
  const accessToken = jwt.sign(
    { sub: user.id, username: user.username, role: user.role, type: 'access' },
    SECRET,
    { expiresIn: ACCESS_TTL }
  );
  const refreshToken = jwt.sign(
    /* jti (id unik) membuat setiap refresh token berbeda walau terbit
       di detik yang sama — penting agar rotasi bisa dicatat tepat */
    { sub: user.id, type: 'refresh', jti: randomBytes(8).toString('hex') },
    SECRET,
    { expiresIn: REFRESH_TTL }
  );
  // refresh token dicatat di db agar bisa dicabut (logout / rotasi)
  db.get('refreshTokens').push({
    token: refreshToken,
    userId: user.id,
    expiresAt: Date.now() + REFRESH_MS
  }).write();
  return { accessToken, refreshToken };
}

function publicUser(user) {
  const { id, name, username, role } = user;   // password tidak pernah ikut
  return { id, name, username, role };
}

function nextId(list) {
  return String(list.reduce((m, row) => Math.max(m, Number(row.id) || 0), 0) + 1);
}

/* ---------- 4. Middleware otentikasi & otorisasi ---------- */
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Access token tidak ditemukan' });
  try {
    const payload = jwt.verify(token, SECRET);
    if (payload.type !== 'access') throw new Error('bukan access token');
    req.user = { id: payload.sub, username: payload.username, role: payload.role };
    next();
  } catch {
    res.status(401).json({ message: 'Access token tidak valid atau kedaluwarsa' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Akses ditolak: peran Anda tidak mencukupi' });
    }
    next();
  };
}

/* ---------- 5. Aturan akses resource ---------- */
server.use((req, res, next) => {
  // daftar refresh token adalah data internal
  if (req.path.startsWith('/refreshTokens')) {
    return res.status(404).json({ message: 'Resource tidak ditemukan' });
  }

  const isUserPath = req.path === '/users' || req.path.startsWith('/users/');

  // pembuatan user hanya lewat /auth/register
  if (isUserPath && req.method === 'POST') {
    return res.status(403).json({ message: 'Gunakan POST /auth/register untuk membuat user' });
  }

  // data user hanya untuk admin — kecuali GET /users/:id (membaca diri sendiri)
  if (isUserPath) {
    const isSelfRead = req.method === 'GET' && req.path.startsWith('/users/');
    return authenticate(req, res, () => {
      if (!isSelfRead) requireRole('admin')(req, res, next);
      else next();
    });
  }

  // tulis produk butuh login; hapus/ubah juga harus admin atau pemiliknya
  if (req.path.startsWith('/products') && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return authenticate(req, res, () => {
      if (req.method === 'POST') {
        req.body.createdBy = req.user.id;       // catat pemilik produk
      } else {
        const product = db.get('products').find({ id: req.path.split('/')[2] }).value();
        const isOwner = product && product.createdBy === req.user.id;
        if (req.user.role !== 'admin' && !isOwner) {
          return res.status(403).json({ message: 'Hanya admin atau pemilik produk yang boleh mengubahnya' });
        }
      }
      next();
    });
  }

  next();
});

/* ---------- 6. Endpoint autentikasi ---------- */
server.post('/auth/register', (req, res) => {
  const { name, username, password } = req.body || {};
  if (!name || !username || !password) {
    return res.status(400).json({ message: 'name, username, dan password wajib diisi' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ message: 'Password minimal 6 karakter' });
  }
  if (db.get('users').find({ username }).value()) {
    return res.status(409).json({ message: 'Username sudah dipakai' });
  }

  const user = {
    id: nextId(db.get('users').value()),
    name,
    username,
    password: hashPassword(password),
    role: 'user'                      // peran selalu 'user' — jangan percaya klien
  };
  db.get('users').push(user).write();

  res.status(201).json({ ...issueTokens(user), user: publicUser(user) });
});

server.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = db.get('users').find({ username }).value();
  if (!user || !checkPassword(String(password), user.password)) {
    return res.status(401).json({ message: 'Username atau password salah' });
  }
  res.json({ ...issueTokens(user), user: publicUser(user) });
});

server.post('/auth/refresh', (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) {
    return res.status(400).json({ message: 'refreshToken wajib dikirim' });
  }

  let payload;
  try {
    payload = jwt.verify(refreshToken, SECRET);
    if (payload.type !== 'refresh') throw new Error('bukan refresh token');
  } catch {
    return res.status(401).json({ message: 'Refresh token tidak valid' });
  }

  const stored = db.get('refreshTokens').find({ token: refreshToken }).value();
  if (!stored || stored.expiresAt < Date.now()) {
    return res.status(401).json({ message: 'Refresh token kedaluwarsa atau sudah dicabut' });
  }

  const user = db.get('users').find({ id: payload.sub }).value();
  if (!user) return res.status(401).json({ message: 'User tidak ditemukan' });

  // rotasi: token lama dicabut, sepasang token baru diterbitkan
  db.get('refreshTokens').remove({ token: refreshToken }).write();
  res.json(issueTokens(user));
});

server.post('/auth/logout', (req, res) => {
  const { refreshToken } = req.body || {};
  if (refreshToken) db.get('refreshTokens').remove({ token: refreshToken }).write();
  res.json({ message: 'Berhasil keluar' });
});

server.get('/auth/me', authenticate, (req, res) => {
  const user = db.get('users').find({ id: req.user.id }).value();
  if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
  res.json({ user: publicUser(user) });
});

/* ---------- 7. CRUD json-server ----------
   Semua route di db.json (products, categories, dll.) dilayani router ini:
   GET/POST /products, GET/PATCH/DELETE /products/:id, dan seterusnya.
   Aturan proteksinya sudah diatur lewat middleware pada bagian 5.        */
server.use(api);

server.listen(PORT, () => {
  console.log(`✔ JSON Server + JWT berjalan di http://localhost:${PORT}`);
  console.log('  admin : admin / admin123');
  console.log('  user  : budi  / budi123');
});
