/* ============================================================
   Pelajaran Docker — Bab 8: Containerize Aplikasi – Bind Mount, .dockerignore & Multi-stage (L8)
   ============================================================ */
'use strict';

window.DOCKER_LESSONS = window.DOCKER_LESSONS || [];

window.DOCKER_LESSONS.push({
  id: 'containerize-app-lanjutan',
  title: 'Containerize Aplikasi: Bind Mount, .dockerignore & Multi-stage Build',
  chapter: 'Dockerfile Lanjutan',
  duration: '9–11 menit',
  intro: [
    'Kamu akan belajar cara nyaman develop pakai Docker (bind mount), mengabaikan file nggak perlu (.dockerignore), dan mengecilkan Image dengan <b>Multi-stage Build</b>.'
  ],
  objectives: [
    'Memahami perbedaan bind mount vs volume (pengantar)',
    'Menggunakan bind mount untuk hot-reload saat development',
    'Membuat & pakai <code>.dockerignore</code>',
    'Memahami multi-stage build untuk optimasi ukuran Image',
    'Menerapkan multi-stage build pada contoh Node.js'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Bind Mount untuk Development</h3><p><b>Bind mount</b> memetakan direktori/ file di host ke dalam container. Sangat berguna saat dev: ubah kode di editor → langsung terlihat di container (tanpa rebuild).</p>'
    },
    {
      type: 'example',
      title: 'Sintaks bind mount (-v)',
      lang: 'bash',
      output: false,
      code: `# Format: -v /path/host:/path/container
# Gunakan absolute path atau $(pwd)

# Contoh: mount folder app-node ke /app di container
docker run -d -p 8085:3000 --name node-dev \
  -v $(pwd):/app \
  -v /app/node_modules \
  node:20-alpine sh -c "cd /app && npm install && npm start"`,
      explain: [
        '<code>-v $(pwd):/app</code> → sync kode host dengan /app di container.',
        '<code>-v /app/node_modules</code> → buat anonymous volume biar node_modules di container tetap (bukan dari host). Ini penting biar deps sesuai environment container.',
        'Khusus dev, kamu bisa pakai tools seperti <code>nodemon</code> di package.json.'
      ]
    },
    {
      type: 'tip',
      title: 'Bind mount di Windows/macOS',
      text: 'Docker Desktop butuh permission akses folder. Pastikan folder project kamu sudah di-share. Di WSL2 lebih smooth pakai path WSL.'
    },
    {
      type: 'text',
      html: '<h3>.dockerignore</h3><p>Mirip <code>.gitignore</code>. File/folder yang masuk <code>.dockerignore</code> TIDAK dikirim ke <b>build context</b>. Tujuannya: lebih kecil, lebih cepat build, hindari masukin file sensitif.</p>'
    },
    {
      type: 'example',
      title: 'Contoh .dockerignore untuk Node.js',
      lang: 'text',
      output: false,
      code: `node_modules
npm-debug.log
Dockerfile*
.dockerignore
.git
.gitignore
README.md
.env
dist
coverage`,
      explain: [
        'Jangan COPY <code>node_modules</code> dari host (harus di-install di dalam container).',
        'Hindari kirim file config/git yang nggak dibutuhkan saat build.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Multi-stage Build</h3><p>Masalah klasik: Image jadi besar karena ada dev-deps, build tools, source mentah. <b>Multi-stage build</b> membagi build jadi beberapa <b>stage</b>. Hanya artefak yang dibutuhkan dari stage akhir yang masuk ke final Image.</p><p>Hasilnya: Image jauh lebih kecil, lebih aman (minimal attack surface).</p>'
    },
    {
      type: 'example',
      title: 'Konsep Multi-stage',
      lang: 'dockerfile',
      output: false,
      code: `# Stage 1: build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]`,
      explain: [
        '<code>AS builder</code> memberi nama stage.',
        '<code>COPY --from=builder</code> mengambil file hasil build dari stage sebelumnya.',
        'Final stage cuma bawa <code>dist</code> + production deps → ukuran jauh lebih kecil.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Aplikasi Node.js dengan Multi-stage (praktis)</h3><p>Misal pakai <code>tsc</code> (TypeScript) atau bundler. Untuk JS murni, multi-stage juga bisa dipakai (mis. pisah deps).</p><p>Contoh sederhana: kita cuma pengen jalankan <code>index.js</code> tanpa dev tools.</p>'
    },
    {
      type: 'example',
      title: 'Dockerfile Multi-stage (Node.js prod)',
      lang: 'dockerfile',
      output: false,
      code: `# Stage 1: install deps
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Stage 2: runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY index.js package.json ./
USER node
EXPOSE 3000
CMD ["node", "index.js"]`,
      explain: [
        '<code>USER node</code> menjalankan container dengan user non-root (praktik keamanan dasar).',
        'Hanya <code>node_modules</code> (prod), <code>index.js</code>, <code>package.json</code> yang dibawa ke final image.',
        'Cek ukuran: bandingin dengan single-stage sebelumnya.'
      ]
    },
    {
      type: 'example',
      title: 'Build & bandingkan ukuran',
      lang: 'bash',
      output: false,
      code: `docker build -t node-single:1.0.0 -f Dockerfile.single .
docker build -t node-multi:1.0.0 -f Dockerfile.multi .

docker image ls | grep node-`,
      explain: ['Biasanya <code>node-multi</code> jauh lebih kecil ketimbang single-stage.']
    },
    {
      type: 'tip',
      title: 'Tips Multi-stage',
      text: 'Kamu bisa pakai base image lebih kecil di final stage (mis. <code>node:20-alpine</code> → <code>distroless</code> lebih ekstrem, tapi butuh pemahaman lebih). Alpine udah cukup untuk pemula.'
    },
    {
      type: 'vocab',
      items: [
        ['Bind mount', 'Mapping langsung folder host → container (sync real-time, cocok dev).'],
        ['Anonymous volume', 'Volume tanpa nama, biasanya auto-managed (dipakai buat "protect" node_modules).'],
        ['.dockerignore', 'Daftar file/folder yang dikecualikan dari build context.'],
        ['Multi-stage build', 'Beberapa FROM dalam 1 Dockerfile untuk memisahkan build vs runtime.'],
        ['AS', 'Memberi alias stage (builder/runner/deps).'],
        ['COPY --from', 'Mengambil artefak dari stage lain.'],
        ['USER', 'Menentukan user yang dipakai saat container jalan (non-root).']
      ]
    }
  ],
  recap: [
    'Bind mount: ubah kode host → langsung muncul di container (dev-friendly).',
    '.dockerignore: perkecil build context & hindari file nggak perlu.',
    'Multi-stage: pisah build & runtime → Image final lebih kecil & minimal.',
    'Pakai <code>USER node</code> sebagai best practice dasar.',
    '<code>COPY --from</code> kunci multi-stage build.'
  ]
});