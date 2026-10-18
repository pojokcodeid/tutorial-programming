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
    'Pada bab ini kamu akan mempelajari tiga hal yang membuat proses pengemasan aplikasi lebih praktis: cara mengembangkan aplikasi dengan nyaman memakai Docker (bind mount), cara mengecualikan file yang tidak diperlukan (.dockerignore), serta cara mengecilkan ukuran image dengan <b>Multi-stage Build</b>.'
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
      html: '<h3>Bind Mount untuk Development</h3><p><b>Bind mount</b> memetakan sebuah direktori atau file di host langsung ke dalam container. Fitur ini sangat berguna saat pengembangan: ketika kamu mengubah kode di editor, perubahan tersebut langsung terlihat di dalam container tanpa perlu melakukan build ulang.</p>'
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
        '<code>-v $(pwd):/app</code> memetakan folder proyek di host ke direktori <code>/app</code> di dalam container sehingga kode selalu sinkron.',
        '<code>-v /app/node_modules</code> membuat anonymous volume untuk melindungi folder <code>node_modules</code> di container agar tidak tertimpa oleh folder dari host. Ini penting agar dependensi tetap sesuai dengan environment container.',
        'Untuk keperluan pengembangan, kamu juga dapat memakai alat seperti <code>nodemon</code> yang tercantum dalam <code>package.json</code> agar aplikasi memulai ulang otomatis.'
      ]
    },
    {
      type: 'tip',
      title: 'Bind mount di Windows/macOS',
      text: 'Docker Desktop memerlukan izin akses folder. Pastikan folder proyekmu sudah diizinkan melalui pengaturan Docker Desktop. Di WSL 2, alangkah baiknya menggunakan path milik WSL agar performanya lebih baik.'
    },
    {
      type: 'text',
      html: '<h3>.dockerignore</h3><p>Cara kerjanya mirip dengan <code>.gitignore</code>. File atau folder yang tercantum di dalam <code>.dockerignore</code> TIDAK dikirim ke <b>build context</b>. Tujuannya adalah menjaga ukuran context tetap kecil, mempercepat proses build, dan mencegah file sensitif ikut terbawa.</p>'
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
        'Jangan menyalin <code>node_modules</code> dari host, karena dependensi harus diinstal di dalam container agar sesuai environment-nya.',
        'Hindari mengirim file konfigurasi atau berkas git yang tidak dibutuhkan saat proses build.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Multi-stage Build</h3><p>Masalah klasik ketika membuat image adalah ukurannya yang menjadi besar karena memuat dependensi pengembangan, alat-alat build, dan source mentah. <b>Multi-stage build</b> memecah proses build menjadi beberapa <b>stage</b>, dan hanya artefak dari stage terakhir yang masuk ke image final.</p><p>Hasilnya adalah image yang jauh lebih kecil dan lebih aman karena memiliki area serangan (attack surface) yang minimal.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Multi-stage build dengan stage builder dan stage runner">
        <rect x="30" y="50" width="330" height="200" rx="10" class="u-dash"/>
        <text x="195" y="80" class="u-title">Stage 1: builder</text>
        <rect x="50" y="100" width="290" height="36" rx="5" class="u-box"/>
        <text x="195" y="123" class="u-lbl" text-anchor="middle">FROM node:20-alpine AS builder</text>
        <rect x="50" y="144" width="290" height="36" rx="5" class="u-box"/>
        <text x="195" y="167" class="u-lbl" text-anchor="middle">RUN npm ci (semua dependensi)</text>
        <rect x="50" y="188" width="290" height="36" rx="5" class="u-box"/>
        <text x="195" y="211" class="u-lbl" text-anchor="middle">RUN npm run build → dist/</text>
        <rect x="400" y="50" width="330" height="200" rx="10" class="u-box"/>
        <text x="565" y="80" class="u-title">Stage 2: runner (image final)</text>
        <rect x="420" y="100" width="290" height="36" rx="5" class="u-hd"/>
        <text x="565" y="123" class="u-lbl" text-anchor="middle">FROM node:20-alpine (stage baru)</text>
        <rect x="420" y="144" width="290" height="36" rx="5" class="u-hd"/>
        <text x="565" y="167" class="u-lbl" text-anchor="middle">RUN npm ci --omit=dev</text>
        <rect x="420" y="188" width="290" height="36" rx="5" class="u-hd"/>
        <text x="565" y="211" class="u-lbl" text-anchor="middle">COPY --from=builder /app/dist</text>
        <line x1="364" y1="150" x2="396" y2="150" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="195" y="274" class="u-lbl" text-anchor="middle">stage ini dibuang setelah build</text>
        <text x="380" y="274" class="u-lbl" text-anchor="middle">COPY --from</text>
        <text x="565" y="274" class="u-lbl" text-anchor="middle">yang masuk image hanya stage terakhir</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 8.1</b> — Hanya artefak hasil build yang dipindahkan ke image final</figcaption></figure>`
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
        '<code>AS builder</code> memberi nama pada stage tersebut agar mudah dirujuk.',
        '<code>COPY --from=builder</code> mengambil file hasil build dari stage sebelumnya.',
        'Stage akhir hanya membawa <code>dist</code> beserta dependensi produksi sehingga ukurannya jauh lebih kecil.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Aplikasi Node.js dengan Multi-stage (praktis)</h3><p>Multi-stage build sangat umum dipakai ketika proyek memerlukan tahap kompilasi, misalnya dengan <code>tsc</code> (TypeScript) atau sebuah bundler. Untuk proyek JavaScript murni pun multi-stage tetap berguna, misalnya untuk memisahkan dependensi produksi dari dependensi pengembangan.</p><p>Pada contoh berikut, kita hanya ingin menjalankan <code>index.js</code> tanpa membawa alat-alat pengembangan.</p>'
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
        '<code>USER node</code> menjalankan container dengan user non-root, yang merupakan praktik keamanan dasar yang dianjurkan.',
        'Hanya <code>node_modules</code> (versi produksi), <code>index.js</code>, dan <code>package.json</code> yang dibawa ke image akhir.',
        'Coba periksa ukurannya dan bandingkan dengan versi single-stage sebelumnya.'
      ]
    },
    {
      type: 'example',
      title: 'Build &amp; bandingkan ukuran',
      lang: 'bash',
      output: false,
      code: `docker build -t node-single:1.0.0 -f Dockerfile.single .
docker build -t node-multi:1.0.0 -f Dockerfile.multi .

docker image ls | grep node-`,
      explain: ['Umumnya <code>node-multi</code> jauh lebih kecil dibandingkan versi single-stage.']
    },
    {
      type: 'tip',
      title: 'Tips Multi-stage',
      text: 'Kamu dapat memakai base image yang lebih kecil lagi pada stage akhir, misalnya <code>distroless</code> yang lebih ekstrem namun memerlukan pemahaman lebih lanjut. Untuk pemula, Alpine sudah cukup memadai.'
    },
    {
      type: 'vocab',
      items: [
        ['Bind mount', 'Pemetaan langsung folder host ke container dengan sinkronisasi waktu nyata, cocok untuk pengembangan.'],
        ['Anonymous volume', 'Volume tanpa nama yang dikelola otomatis oleh Docker, sering dipakai untuk melindungi <code>node_modules</code>.'],
        ['.dockerignore', 'Daftar file atau folder yang dikecualikan dari build context.'],
        ['Multi-stage build', 'Beberapa instruksi <code>FROM</code> dalam satu Dockerfile untuk memisahkan tahap build dan runtime.'],
        ['AS', 'Memberi nama (alias) pada sebuah stage, misalnya builder, runner, atau deps.'],
        ['COPY --from', 'Mengambil artefak hasil build dari stage lain.'],
        ['USER', 'Menentukan user yang dipakai saat container berjalan, sebaiknya non-root.']
      ]
    }
  ],
  recap: [
    'Bind mount membuat perubahan kode di host langsung muncul di container sehingga nyaman untuk pengembangan.',
    '.dockerignore mengecilkan build context dan menghindari file yang tidak diperlukan ikut terkirim.',
    'Multi-stage build memisahkan tahap build dan runtime sehingga image akhir jauh lebih ramping dan aman.',
    'Gunakan <code>USER node</code> sebagai praktik keamanan dasar.',
    'Instruksi <code>COPY --from</code> adalah kunci keberhasilan multi-stage build.'
  ]
});