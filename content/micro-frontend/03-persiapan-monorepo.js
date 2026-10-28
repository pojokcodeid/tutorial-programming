/* ============================================================
   Pelajaran Micro-Frontend — Bab 3: Menyiapkan Monorepo
   ============================================================ */
'use strict';

window.MICROFRONTEND_LESSONS = window.MICROFRONTEND_LESSONS || [];

window.MICROFRONTEND_LESSONS.push({
  id: 'mf-persiapan-monorepo',
  title: 'Menyiapkan Monorepo dan Lingkungan Kerja',
  chapter: 'Fondasi',
  duration: '19 menit',
  intro: [
    'Sebelum kamu menulis shell dan remote, kamu perlu satu tempat kerja yang bisa membangun semuanya dengan perintah yang sama. Untuk TokoMicro, tempat itu adalah <b>monorepo npm workspaces</b>: shell dan empat remote berada di <code>apps/*</code>, sedangkan kontrak dan design system berada di <code>packages/*</code>.',
    'Monorepo di sini bukan berarti satu build. Setiap aplikasi tetap punya <code>package.json</code>, <code>vite.config.ts</code>, dan hasil build sendiri. Yang dibagi adalah repositori, instalasi dependensi, konfigurasi TypeScript, dan orkestrasi perintah.',
    'Bab ini menyiapkan fondasi tersebut: Node 18+, npm workspaces, TypeScript strict, Turbo, rentang port 4173 sampai 4178, serta script build, typecheck, test, dan start yang akan kamu pakai sampai bab terakhir.'
  ],
  objectives: [
    'Menjelaskan alasan memakai monorepo untuk proyek micro-frontend',
    'Menyusun workspace apps/* dan packages/* dengan npm workspaces',
    'Menerapkan TypeScript strict lewat tsconfig.base yang dibagi',
    'Mengonfigurasi Turbo dan rentang port TokoMicro',
    'Menjalankan typecheck serta memverifikasi outputnya'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Mengapa Monorepo, Bukan Satu Build</h3><p>Dengan npm workspaces, satu kali <code>npm install</code> memasang dependensi untuk semua workspace dan membuat symlink antar paket. Kamu bisa mengimpor <code>@tokomicro/contracts</code> dari shell tanpa menerbitkannya ke registry, dan perubahan kontrak langsung terlihat oleh semua remote.</p><p>Namun batas rilis tetap dijaga: <code>apps/header</code> punya build sendiri, <code>apps/products</code> punya build sendiri, dan shell tidak ikut dibangun ketika header berubah. Monorepo mempercepat pengembangan, bukan menghapus kemandirian rilis.</p><p>Gunakan Node <b>18 atau lebih baru</b>. Vite 5, Turbo 2, dan npm workspaces modern membutuhkan Node 18+; Node 16 sudah tidak didukung. Periksa dengan <code>node -v</code> dan <code>npm -v</code> sebelum melanjutkan.</p>'
    },
    {
      type: 'text',
      html: '<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Struktur monorepo TokoMicro: apps shell header products cart account legacy dan packages contracts shared ui-kit i18n telemetry"><rect x="20" y="16" width="330" height="250" rx="10" class="u-box"/><text x="40" y="42" class="u-title">apps/ — aplikasi yang dirilis</text><rect x="40" y="58" width="290" height="30" rx="6" class="u-hl"/><text x="52" y="78" class="u-lbl">shell :4173 · BrowserRouter · API /api/*</text><rect x="40" y="94" width="290" height="30" rx="6" class="u-box"/><text x="52" y="114" class="u-lbl">header :4174 · remote header</text><rect x="40" y="130" width="290" height="30" rx="6" class="u-box"/><text x="52" y="150" class="u-lbl">products :4175 · remote katalog</text><rect x="40" y="166" width="290" height="30" rx="6" class="u-box"/><text x="52" y="186" class="u-lbl">cart :4176 · remote keranjang</text><rect x="40" y="202" width="290" height="30" rx="6" class="u-box"/><text x="52" y="222" class="u-lbl">account :4177 · remote akun</text><rect x="40" y="238" width="290" height="22" rx="6" class="u-box"/><text x="52" y="254" class="u-lbl">legacy :4178 · aplikasi lama statis</text><rect x="410" y="16" width="330" height="250" rx="10" class="u-box"/><text x="430" y="42" class="u-title">packages/ — kode bersama</text><rect x="430" y="58" width="290" height="30" rx="6" class="u-hl"/><text x="442" y="78" class="u-lbl">contracts · AppContext, schema, RemoteName</text><rect x="430" y="94" width="290" height="30" rx="6" class="u-box"/><text x="442" y="114" class="u-lbl">shared · cart store, event, format rupiah</text><rect x="430" y="130" width="290" height="30" rx="6" class="u-box"/><text x="442" y="150" class="u-lbl">ui-kit · token --tm-*, Button, Card</text><rect x="430" y="166" width="290" height="30" rx="6" class="u-box"/><text x="442" y="186" class="u-lbl">i18n · kamus id/en dan createTranslator</text><rect x="430" y="202" width="290" height="30" rx="6" class="u-box"/><text x="442" y="222" class="u-lbl">telemetry · event, error, metric</text><rect x="430" y="238" width="290" height="22" rx="6" class="u-hl"/><text x="442" y="254" class="u-lbl">satu npm install · symlink antar workspace</text></svg></div><figcaption class="fig-cap"><b>Gambar 3.1</b> — Aplikasi tetap mandiri, tetapi berbagi repositori, instalasi, dan konfigurasi dasar</figcaption></figure>'
    },
    {
      type: 'example',
      title: 'package.json root dan workspace aplikasi',
      lang: 'json',
      output: false,
      code: `{
  "name": "tokomicro-react",
  "private": true,
  "type": "module",
  "workspaces": ["packages/*", "apps/*"],
  "engines": { "node": ">=18" },
  "scripts": {
    "build": "turbo run build",
    "typecheck": "npm run typecheck --workspaces --if-present",
    "test": "vitest run",
    "test:e2e": "node e2e-smoke.mjs",
    "start": "node server.js"
  },
  "devDependencies": {
    "turbo": "^2.3.3",
    "typescript": "^5.7.2",
    "vite": "^5.4.0",
    "vitest": "^2.1.8"
  }
}

// apps/header/package.json
{
  "name": "@tokomicro/header",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --port 4174",
    "build": "vite build",
    "preview": "vite preview --port 4174",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@tokomicro/contracts": "*",
    "@tokomicro/shared": "*",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  }
}`,
      explain: [
        '<code>workspaces</code> membuat npm mengenali semua folder sebagai paket. Dependensi internal ditulis <code>"*"</code> karena versinya selalu mengikuti workspace lokal.',
        '<code>--if-present</code> penting agar perintah typecheck tidak gagal pada paket yang belum punya script tersebut.',
        'Setiap aplikasi tetap memiliki script <code>build</code> dan <code>typecheck</code> sendiri; root hanya mengorkestrasi.'
      ]
    },
    {
      type: 'example',
      title: 'TypeScript strict yang dibagi',
      lang: 'json',
      output: false,
      code: `// tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "types": ["vite/client", "node"]
  }
}

// apps/shell/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src", "vite.config.ts"]
}

// packages/contracts/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src"]
}`,
      explain: [
        '<code>strict: true</code> menangkap <code>undefined</code> yang tidak diperiksa dan kontrak props yang salah sebelum remote dijalankan.',
        'Semua workspace mewarisi aturan yang sama, sehingga error tipe tidak berbeda antar tim.',
        '<code>moduleResolution: "Bundler"</code> cocok untuk Vite dan ekspor paket workspace.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Turbo dan Peta Port</h3><p>Turbo menjalankan task secara paralel dan menyimpan cache hasil build. Konfigurasi minimalnya:</p><pre><code class="language-json">{\n  "$schema": "https://turbo.build/schema.json",\n  "tasks": {\n    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },\n    "typecheck": { "dependsOn": ["^typecheck"], "outputs": [] },\n    "test": { "dependsOn": ["^build"], "outputs": [] }\n  }\n}</code></pre><table class="vocab"><tr><th>Port</th><th>Aplikasi</th><th>Peran</th></tr><tr><td>4173</td><td>shell</td><td>BrowserRouter, layout, login, API <code>/api/*</code></td></tr><tr><td>4174</td><td>header</td><td>Remote navigasi dan badge keranjang</td></tr><tr><td>4175</td><td>products</td><td>Remote katalog dan detail produk</td></tr><tr><td>4176</td><td>cart</td><td>Remote keranjang dan checkout</td></tr><tr><td>4177</td><td>account</td><td>Remote akun dan pesanan</td></tr><tr><td>4178</td><td>legacy</td><td>Aplikasi lama untuk migrasi bertahap</td></tr></table><p>Gunakan <code>strictPort: true</code> di setiap <code>vite.config.ts</code> agar Vite tidak diam-diam berpindah port dan membuat URL remote di manifest salah.</p>'
    },
    {
      type: 'text',
      html: '<h3>Praktik: Membuat Workspace dan Menjalankan Typecheck</h3><ol><li>Jalankan <code>node -v</code>; pastikan keluarannya <code>v18</code> atau lebih tinggi.</li><li>Dari root proyek, buat <code>package.json</code> dengan <code>workspaces: ["packages/*", "apps/*"]</code> dan properti <code>private: true</code>.</li><li>Buat folder <code>packages/contracts/src</code>, <code>packages/shared/src</code>, dan <code>apps/header/src</code>.</li><li>Buat <code>tsconfig.base.json</code>, lalu setiap workspace membuat <code>tsconfig.json</code> yang mengextend berkas itu.</li><li>Jalankan <code>npm install</code> dari root. Periksa bahwa <code>node_modules/@tokomicro</code> berisi symlink ke paket lokal.</li><li>Jalankan <code>npm run typecheck</code>, lalu <code>npm run build</code>.</li></ol>'
    },
    {
      type: 'text',
      html: '<h3>Verifikasi Output</h3><p>Typecheck yang berhasil tidak menampilkan error dan keluar dengan kode <code>0</code>. Output kurang lebih seperti ini:</p><pre><code class="language-bash">$ npm run typecheck\n\n> tokomicro-react@2.0.0 typecheck\n> npm run typecheck --workspaces --if-present\n\n> @tokomicro/contracts@2.0.0 typecheck\n> tsc --noEmit\n\n> @tokomicro/shared@2.0.0 typecheck\n> tsc --noEmit\n\n> @tokomicro/header@2.0.0 typecheck\n> tsc --noEmit\n\n# tidak ada error, exit code 0</code></pre><p><b>Checkpoint:</b> jalankan <code>npm ls react</code> dan pastikan hanya ada satu versi React yang terpasang. Setelah <code>npm run build</code>, pastikan <code>apps/header/dist/assets/remoteEntry.js</code> ada. Bila dua hal ini benar, fondasi monorepo siap dipakai bab berikutnya.</p>'
    },
    {
      type: 'warn',
      title: 'Jangan Biarkan Dua React di Satu Halaman',
      text: 'Dependensi React yang berbeda versi antar workspace dapat menghasilkan dua salinan React. Gejalanya adalah <code>Invalid hook call</code> atau context yang tidak terbaca. Samakan versi React dan ReactDOM di semua workspace, gunakan <code>npm ls react</code> untuk memeriksa, dan tambahkan <code>shared</code> singleton di Module Federation pada bab berikutnya. Port yang bertabrakan juga sering menyamar sebagai bug federasi; pastikan 4173 sampai 4178 tidak dipakai proses lain.'
    },
    {
      type: 'vocab',
      items: [
        ['Monorepo', 'Satu repositori yang berisi beberapa aplikasi dan paket dengan riwayat versi bersama.'],
        ['npm workspaces', 'Fitur npm untuk mengelola banyak paket dalam satu instalasi dan symlink lokal.'],
        ['Workspace', 'Satu paket di dalam monorepo, misalnya apps/header atau packages/contracts.'],
        ['Turbo', 'Alat orkestrasi task yang menjalankan build secara paralel dan menyimpan cache.'],
        ['tsconfig.base', 'Konfigurasi TypeScript induk yang diwarisi semua workspace.'],
        ['strict mode', 'Kumpulan pemeriksaan TypeScript yang menolak banyak pola berbahaya.'],
        ['Symlink workspace', 'Tautan node_modules ke paket lokal sehingga perubahan langsung terlihat.'],
        ['strictPort', 'Pengaturan Vite agar gagal bila port sudah dipakai, bukan berpindah diam-diam.']
      ]
    }
  ],
  recap: [
    'Monorepo menyatukan repositori, instalasi, dan konfigurasi, tetapi setiap aplikasi tetap punya build sendiri.',
    'npm workspaces memakai apps/* untuk aplikasi dan packages/* untuk kode bersama.',
    'TypeScript strict diwarisi dari tsconfig.base agar semua tim mendapat aturan yang sama.',
    'Turbo mengorkestrasi build dan typecheck; port 4173 sampai 4178 harus tetap konsisten.',
    'Checkpoint nyata adalah typecheck exit 0, satu versi React, dan remoteEntry.js yang dihasilkan.'
  ]
});
