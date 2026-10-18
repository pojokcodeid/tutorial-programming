/* ============================================================
   Pelajaran Kubernetes — Bab 4: ReplicaSet & Deployment
   ============================================================ */
'use strict';

window.KUBERNETES_LESSONS = window.KUBERNETES_LESSONS || [];

window.KUBERNETES_LESSONS.push({
  id: 'replicaset-deployment',
  title: 'ReplicaSet & Deployment',
  chapter: 'Objek Inti',
  duration: '8–10 menit',
  intro: [
    'Pernahkah aplikasimu "tiba-tiba hilang" hanya karena satu proses container mengalami error fatal? Dengan Pod yang dibuat secara manual, Kubernetes tidak tahu bahwa Pod itu seharusnya selalu hidup — begitu mati, semuanya berakhir dan kamu harus membuatnya kembali sendiri.',
    '<b>ReplicaSet</b> adalah objek yang menjaga agar jumlah Pod selalu sesuai keinginanmu, termasuk membuat Pod pengganti secara otomatis (self-healing). Di atasnya berdiri <b>Deployment</b>, objek tingkat atas yang mengelola ReplicaSet sehingga kamu bisa melakukan pembaruan tanpa downtime, rollback, dan scaling dengan aman.',
    'Bab ini adalah inti workflow Kubernetes sehari-hari: kamu menulis manifest Deployment, menerapkannya dengan <code>kubectl apply</code>, lalu memantau rollout, mengubah skala, dan mengurungkan perubahan bila ternyata bermasalah.'
  ],
  objectives: [
    'Memahami kelemahan Pod tunggal dan peran ReplicaSet dalam self-healing',
    'Membaca field penting Deployment: replicas, selector, template, dan strategy',
    'Menjalankan siklus penuh: apply, scale, set image, rollout status, dan undo',
    'Membedakan strategi RollingUpdate dan Recreate serta kapan menggunakannya'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Pod Tunggal Rapuh, ReplicaSet Bertahan</h3><p>Bayangkan kamu membuat Pod dengan <code>kubectl apply -f pod-web.yaml</code>. Aplikasi berjalan normal, sampai suatu saat node tempatnya berjalan mengalami masalah. Pod mati — dan tidak ada yang membuatnya kembali, karena secara harfiah tidak ada objek yang bertugas "mengingat" bahwa seharusnya ada 1 Pod web yang hidup.</p><p><b>ReplicaSet</b> menyelesaikan masalah ini. Objek tersebut terus memantau jumlah Pod yang cocok dengan <b>selector</b>-nya dan segera membuat Pod pengganti ketika ada yang mati. Dua field kuncinya:</p><ul><li><b>spec.replicas</b> — berapa banyak Pod yang diinginkan (misalnya 3).</li><li><b>spec.selector.matchLabels</b> — label Pod apa yang menjadi tanggung jawabnya (misalnya <code>app: web</code>).</li></ul><p>Karena itu ReplicaSet disebut <i>self-healing</i>: angka 3 di spec.replicas adalah "janji" yang selalu dijaga, bukan perintah sekali jalan.</p>'
    },
    {
      type: 'example',
      title: 'Manifest ReplicaSet Sederhana',
      lang: 'yaml',
      output: false,
      code: `apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: web-rs
spec:
  replicas: 3                      # janji: selalu ada 3 pod
  selector:
    matchLabels:
      app: web                     # pod yang bertanggung jawab
  template:
    metadata:
      labels:
        app: web                   # WAJIB cocok dengan selector
    spec:
      containers:
        - name: app
          image: nginx:1.25
          ports:
            - containerPort: 80`,
      explain: [
        'Field template di dalam ReplicaSet adalah "cetak biru" Pod yang akan dibuatnya, lengkap dengan label yang dipakai selector.',
        'Bila kamu menghapus salah satu Pod (kubectl delete pod ...), ReplicaSet segera membuat Pod pengganti karena jumlahnya kurang dari spec.replicas.',
        'Namun kamu jarang membuat ReplicaSet secara langsung — ada alasan yang lebih baik di bab berikutnya.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Deployment: Objek yang Kamu Tulis Sehari-hari</h3><p>Secara teknis ReplicaSet sudah bisa self-healing dan diskalakan, tetapi ia punya keterbatasan: mengganti versi image tetap proses manual, sulit dilacak riwayatnya, dan rumit diurungkan. Di sinilah <b>Deployment</b> berperan sebagai objek tingkat atas yang <b>mengelola ReplicaSet untukmu</b>. Manfaat utamanya:</p><ul><li><b>Rolling update</b> — mengganti versi aplikasi sedikit demi sedikit tanpa downtime.</li><li><b>Rollback</b> — mengembalikan ke versi sebelumnya dengan satu perintah.</li><li><b>Scaling</b> — menambah atau mengurangi jumlah replica, misalnya dari 3 ke 5.</li><li><b>Revisi deklaratif</b> — setiap perubahan manifest tercatat sebagai revisi rollout yang bisa dilihat kembali.</li></ul><p>Kabel pengikat ketiga lapisan ini adalah <b>label dan selector</b>. Deployment memilih ReplicaSet lewat selector, lalu ReplicaSet memilih Pod lewat selector yang sama. Karena pola pengikatan inilah perubahan pada Deployment selalu sampai ke Pod yang benar — dan selama rollout, kamu bisa melihat dua ReplicaSet (versi lama dan versi baru) hidup berdampingan.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Hierarki Deployment yang mengelola ReplicaSet versi lama dan versi baru beserta pod masing-masing saat rolling update">
        <rect x="270" y="18" width="220" height="52" rx="8" class="u-hd"/>
        <text x="380" y="42" class="u-title" text-anchor="middle">Deployment web</text>
        <text x="380" y="60" class="u-lbl" text-anchor="middle">spec.replicas: 3 · selector app=web</text>
        <line x1="380" y1="70" x2="380" y2="88" class="u-line"/>
        <line x1="230" y1="88" x2="530" y2="88" class="u-line"/>
        <line x1="230" y1="88" x2="230" y2="100" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="530" y1="88" x2="530" y2="100" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="120" y="104" width="220" height="50" rx="8" class="u-box"/>
        <text x="230" y="126" class="u-title" text-anchor="middle">ReplicaSet web-6c7d8e</text>
        <text x="230" y="144" class="u-lbl" text-anchor="middle">versi lama · nginx:1.25 · 2 pod</text>
        <rect x="420" y="104" width="220" height="50" rx="8" class="u-box"/>
        <text x="530" y="126" class="u-title" text-anchor="middle">ReplicaSet web-9f8a7b</text>
        <text x="530" y="144" class="u-lbl" text-anchor="middle">versi baru · nginx:1.26 · 3 pod</text>
        <line x1="230" y1="154" x2="230" y2="172" class="u-line"/>
        <line x1="180" y1="172" x2="260" y2="172" class="u-line"/>
        <line x1="180" y1="172" x2="180" y2="186" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="260" y1="172" x2="260" y2="186" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="142" y="188" width="76" height="44" rx="6" class="u-box"/>
        <text x="180" y="208" class="u-title" text-anchor="middle">web-x9y8</text>
        <text x="180" y="226" class="u-lbl" text-anchor="middle">nginx:1.25</text>
        <rect x="222" y="188" width="76" height="44" rx="6" class="u-box"/>
        <text x="260" y="208" class="u-title" text-anchor="middle">web-k3l4</text>
        <text x="260" y="226" class="u-lbl" text-anchor="middle">nginx:1.25</text>
        <line x1="530" y1="154" x2="530" y2="172" class="u-line"/>
        <line x1="450" y1="172" x2="610" y2="172" class="u-line"/>
        <line x1="450" y1="172" x2="450" y2="186" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="530" y1="172" x2="530" y2="186" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="610" y1="172" x2="610" y2="186" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="412" y="188" width="76" height="44" rx="6" class="u-box"/>
        <text x="450" y="208" class="u-title" text-anchor="middle">web-a1b2</text>
        <text x="450" y="226" class="u-lbl" text-anchor="middle">nginx:1.26</text>
        <rect x="492" y="188" width="76" height="44" rx="6" class="u-box"/>
        <text x="530" y="208" class="u-title" text-anchor="middle">web-c5d6</text>
        <text x="530" y="226" class="u-lbl" text-anchor="middle">nginx:1.26</text>
        <rect x="572" y="188" width="76" height="44" rx="6" class="u-box"/>
        <text x="610" y="208" class="u-title" text-anchor="middle">web-e7f8</text>
        <text x="610" y="226" class="u-lbl" text-anchor="middle">nginx:1.26</text>
        <text x="380" y="272" class="u-lbl" text-anchor="middle">matchLabels app=web mengikat ketiga lapisan: Deployment → ReplicaSet → Pod</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 4.1</b> — Saat rollout, Deployment membuat ReplicaSet baru lalu memperkecil ReplicaSet lama hingga tersisa nol pod</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Manifest Deployment Lengkap (3 Replicas, RollingUpdate)',
      lang: 'yaml',
      output: false,
      code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web                      # mengikat deployment ke replicaset & pod
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1                   # maksimal 1 pod baru di atas target
      maxUnavailable: 0             # pod lama tidak ada yang dihentikan dulu
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: app
          image: nginx:1.25         # tag spesifik, jangan :latest
          ports:
            - containerPort: 80`,
      explain: [
        'Deployment tidak pernah menyentuh Pod secara langsung; ia membuat dan mengelola ReplicaSet yang sesuai dengan spec.selector dan pod template.',
        'Dengan maxSurge 1 dan maxUnavailable 0, Kubernetes membuat 1 pod baru dengan image nginx:1.26 lebih dulu sebelum mematikan pod lama — inilah dasar rolling update tanpa downtime.',
        'Karena jumlah pod tetap aman (3), konfigurasi ini cocok untuk aplikasi yang harus selalu melayani trafik.'
      ]
    },
    {
      type: 'example',
      title: 'Alur Kerja Harian: Apply, Scale, Update, dan Undo',
      lang: 'bash',
      output: false,
      code: `# 1. Terapkan manifest dan lihat semua objek terkait
kubectl apply -f deployment-web.yaml
kubectl get deploy,rs,pods -l app=web

# 2. Ubah skala tanpa menyentuh file manifest
kubectl scale deployment web --replicas=5

# 3. Perbarui image (memulai rolling update) dan pantau progresnya
kubectl set image deployment/web app=nginx:1.26
kubectl rollout status deployment/web

# 4. Periksa riwayat revisi, lalu urungkan bila bermasalah
kubectl rollout history deployment/web
kubectl rollout undo deployment/web
# atau kembali ke revisi tertentu
kubectl rollout undo deployment/web --to-revision=3`,
      explain: [
        'kubectl apply menerapkan manifest secara deklaratif; perintah ini aman dijalankan berulang dengan hasil sama (idempotent).',
        'Perintah scale dan set image memodifikasi objek Deployment di cluster, sehingga manifest lokal tetap menjadi satu-satunya sumber kebenaran bila kamu mengelolanya lewat Git.',
        'kubectl set image membuat revisi rollout baru yang terekam di rollout history; kubectl rollout undo mengembalikan Deployment ke pod template revisi sebelumnya.',
        'Selalu tunggu rollout selesai dengan kubectl rollout status sebelum menyatakan rilis berhasil.'
      ]
    },
    {
      type: 'tip',
      title: 'Pakai Tag Image yang Spesifik',
      text: 'Selalu gunakan tag versi yang spesifik (misalnya nginx:1.25) atau digest image, jangan :latest. Dengan :latest, rolling update tidak mendeteksi perubahan apa pun karena tag-nya tetap sama, dan kamu kehilangan kemampuan melacak revisi mana yang berjalan di produksi.'
    },
    {
      type: 'warn',
      title: 'Selector Deployment Bersifat Immutable',
      text: 'Field spec.selector pada Deployment tidak bisa diubah setelah objek dibuat. Bila label aplikasimu harus berganti total (misalnya dari app: frontend ke app: web), buat Deployment baru dengan nama berbeda, atau hapus dan buat ulang objeknya — jangan memaksakan kubectl apply dengan selector yang berbeda karena akan ditolak oleh API server.'
    },
    {
      type: 'vocab',
      items: [
        ['ReplicaSet', 'Objek yang menjaga jumlah Pod sesuai spec.replicas dan membuat Pod pengganti bila ada yang mati.'],
        ['Deployment', 'Controller tingkat atas yang mengelola ReplicaSet untuk rolling update, rollback, dan scaling.'],
        ['Label', 'Pasangan kunci:nilai (misal app: web) yang ditempel pada objek untuk seleksi dan pengelompokan.'],
        ['Selector', 'Ekspresi pemilih (matchLabels) yang menghubungkan controller dengan Pod yang menjadi tanggung jawabnya.'],
        ['Rolling Update', 'Strategi pembaruan yang mengganti Pod lama dengan Pod baru secara bertahap tanpa downtime.'],
        ['Rollback', 'Proses mengembalikan Deployment ke revisi sebelumnya, misalnya dengan kubectl rollout undo.'],
        ['Self-healing', 'Kemampuan cluster menggantikan Pod yang rusak atau mati agar jumlahnya kembali sesuai spec.']
      ]
    }
  ],
  recap: [
    'Pod tunggal yang dibuat manual tidak dibuat ulang secara otomatis saat mati; ReplicaSet menjaga jumlah Pod tetap sesuai spec.replicas.',
    'Deployment adalah objek tingkat atas yang mengelola ReplicaSet, memberi rolling update, rollback, scaling, dan riwayat revisi.',
    'Label dan selector adalah pengikat: Deployment → ReplicaSet → Pod; selector Deployment tidak bisa diubah setelah dibuat.',
    'Siklus harian: kubectl apply, scale --replicas, set image, rollout status/history, dan rollout undo --to-revision=N.'
  ]
});
