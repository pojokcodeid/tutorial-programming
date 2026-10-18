/* ============================================================
   Pelajaran Kubernetes — Bab 10: Resource Request/Limit, QoS & Health Probe
   ============================================================ */
'use strict';

window.KUBERNETES_LESSONS = window.KUBERNETES_LESSONS || [];

window.KUBERNETES_LESSONS.push({
  id: 'resource-qos-probe',
  title: 'Resource Request/Limit, QoS & Health Probe',
  chapter: 'Skala & Keandalan',
  duration: '10–12 menit',
  intro: [
    'Bayangkan aplikasi tokomu berjalan lancar di laptop, tetapi begitu masuk cluster tiba-tiba pod-nya berstatus <code>CrashLoopBackOff</code> padahal nodenya masih menyimpan sisa memori. Atau sebaliknya: satu pod rakus CPU menghabiskan seluruh kuota node sehingga pod lain ikut melambat. Masalah seperti ini muncul karena Kubernetes <b>tidak tahu berapa sumber daya yang benar-benar dibutuhkan</b> aplikasimu.',
    'Jawabannya adalah dua mekanisme bawaan Kubernetes. <b>Anggaran sumber daya</b> (requests dan limits) membuat scheduler tahu kebutuhan tiap pod sekaligus membatasi pemakaian berlebih. <b>Health probe</b> memberi tahu Kubernetes kapan aplikasi benar-benar sehat dan siap menerima trafik, bukan sekadar prosesnya masih hidup.',
    'Pada bab ini kamu akan membedakan requests dan limits, mengenali kelas Quality of Service beserta urutan prioritasnya saat node kehabisan memori, memeriksa pemakaian aktual dengan <code>kubectl top</code>, serta mengonfigurasi liveness, readiness, dan startup probe pada sebuah Deployment.'
  ],
  objectives: [
    'Membedakan requests dan limits beserta dampaknya: throttling dan OOMKilled',
    'Memahami satuan CPU (millicore) dan memory (Mi/Gi) serta cara menentukan nilainya',
    'Mengenali kelas QoS Guaranteed, Burstable, dan BestEffort beserta urutan eviksinya',
    'Mengonfigurasi liveness, readiness, dan startup probe pada sebuah Deployment'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Requests vs Limits</h3><p>Setiap container sebaiknya menyatakan kebutuhan sumber dayanya lewat dua field di bagian <code>resources</code>:</p><ul><li><b>requests</b> — jaminan minimum kapasitas yang disediakan scheduler saat pod ditempatkan ke node. Nilai ini dipakai saat penjadwalan dan menjadi dasar perhitungan utilisasi pada HPA.</li><li><b>limits</b> — batas maksimum pemakaian. Di luar batas itu, container dibatasi (CPU) atau dihentikan (memory).</li></ul><p>Satuan CPU dinyatakan dalam millicore: <code>250m</code> berarti seperempat inti dan <code>1000m</code> sama dengan 1 inti penuh. Memory memakai satuan biner: <code>128Mi</code> (mebibyte) dan <code>1Gi</code> (gibibyte, setara 1024Mi).</p><h3>Yang Terjadi Saat Limit Terlampaui</h3><ul><li><b>CPU</b> — container tidak dibunuh, melainkan mengalami <b>throttling</b>: proses tetap berjalan tetapi diperlambat sesuai kuota. Aplikasi terasa patah-patah, bukan crash.</li><li><b>Memory</b> — container dianggap melanggar batas dan <b>OOMKilled</b> (Out of Memory), lalu di-restart oleh Kubernetes sesuai <code>restartPolicy</code>. Gejalanya pod mendadak <code>CrashLoopBackOff</code> meski kodenya sehat.</li></ul><h3>Kelas Quality of Service (QoS)</h3><p>Kombinasi requests dan limits menentukan kelas QoS sebuah pod:</p><ul><li><b>Guaranteed</b> — semua container menyetarakan requests dengan limits, baik CPU maupun memory. Paling stabil, cocok untuk beban penting.</li><li><b>Burstable</b> — minimal satu container memiliki requests yang lebih kecil dari limits. Paling umum untuk aplikasi web.</li><li><b>BestEffort</b> — tidak ada requests maupun limits sama sekali. Pod hanya memakai sumber daya sisa node.</li></ul><p>Saat sebuah node kehabisan memori, kubelet memangkas pod mengikuti urutan: <b>BestEffort lebih dulu</b>, lalu Burstable dengan pemakaian paling tinggi dibanding nilai requests-nya, dan pod Guaranteed baru tersentuh paling akhir.</p><h3>Memeriksa Pemakaian Aktual</h3><p>Angka requests dan limits sebaiknya berbasis data, bukan tebakan. <code>kubectl top</code> menampilkan pemakaian aktual CPU dan memory per pod maupun per node, tetapi membutuhkan <b>metrics-server</b> yang berjalan di cluster; tanpanya muncul pesan bahwa metrics API tidak tersedia. Kamu juga bisa membaca kelas QoS sebuah pod langsung dari field statusnya, serta melihat total alokasi sumber daya sebuah node lewat <code>kubectl describe node</code>.</p>'
    },
    {
      type: 'example',
      title: 'Pod dengan Requests, Limits, dan Kelas Burstable',
      lang: 'yaml',
      output: false,
      code: `apiVersion: v1
kind: Pod
metadata:
  name: web-qos
  labels:
    app: web
spec:
  containers:
    - name: nginx
      image: nginx:1.27-alpine
      ports:
        - containerPort: 80
      resources:
        requests:
          cpu: 100m
          memory: 128Mi
        limits:
          cpu: 500m
          memory: 256Mi`,
      explain: [
        'Nilai requests 100m dan 128Mi adalah jaminan minimum yang dipakai scheduler saat menempatkan pod; limits 500m dan 256Mi adalah batas maksimum pemakaian.',
        'Pod ini masuk kelas <b>Burstable</b> karena requests lebih kecil dari limits pada kedua sumber daya.',
        'Bila pemakaian CPU melewati 500m, container mengalami throttling; bila memory melebihi 256Mi, container di-OOMKilled lalu di-restart.',
        'Catatan satuan: 1000m sama dengan 1 inti CPU penuh, dan Mi serta Gi adalah satuan biner sehingga 1Gi = 1024Mi.'
      ]
    },
    {
      type: 'example',
      title: 'kubectl top: Pemakaian Aktual dan Kelas QoS',
      lang: 'bash',
      output: false,
      code: `# Pastikan metrics-server sudah aktif di cluster
kubectl top pod web-qos
kubectl top nodes

# Lihat kelas QoS sebuah pod
kubectl get pod web-qos -o jsonpath='{.status.qosClass}'
echo ""

# Lihat total alokasi sumber daya sebuah node
kubectl describe node minikube | grep -A 6 "Allocated resources"`,
      explain: [
        '<code>kubectl top</code> menampilkan pemakaian aktual CPU dan memory, bukan angka konfigurasi.',
        'Field <code>status.qosClass</code> menegaskan hasil analisis requests dan limits: Guaranteed, Burstable, atau BestEffort.',
        'Bagian "Allocated resources" pada <code>describe node</code> menjumlahkan requests seluruh pod, sehingga kamu tahu sisa kapasitas node.',
        'Bila perintah top gagal, kemungkinan besar metrics-server belum terpasang — hal ini akan dibahas pada bab autoscaling.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Health Probe: Liveness, Readiness, Startup</h3><p>Tanpa probe, Kubernetes hanya tahu satu hal: apakah proses di dalam container masih ada. Probe memberi tahu apakah aplikasi benar-benar sehat dan siap melayani. Ada tiga jenis:</p><ul><li><b>Liveness probe</b> — bila gagal berkali-kali, container di-restart. Dipakai untuk mendeteksi aplikasi yang macet atau deadlock.</li><li><b>Readiness probe</b> — bila gagal, pod dikeluarkan dari Endpoints Service sehingga tidak menerima trafik, tetapi container <b>tidak</b> di-restart. Dipakai untuk kondisi sementara seperti koneksi database belum siap atau cache belum penuh.</li><li><b>Startup probe</b> — untuk aplikasi yang lambat bangun. Selama startup probe belum berhasil, liveness dan readiness belum dijalankan, sehingga aplikasi lama tidak dianggap gagal.</li></ul><p>Ketiganya mendukung tiga metode pemeriksaan: <code>httpGet</code> (sehat bila kode respons 200 sampai 399), <code>tcpSocket</code> (cek port terbuka), dan <code>exec</code> (jalankan perintah di dalam container).</p><p>Field pengatur waktu: <code>initialDelaySeconds</code> menunda pemeriksaan pertama, <code>periodSeconds</code> menentukan jarak antar pemeriksaan, <code>timeoutSeconds</code> membatasi lama respons, <code>failureThreshold</code> menyebut jumlah kegagalan sebelum dianggap gagal, dan <code>successThreshold</code> menyebut jumlah keberhasilan sebelum dianggap sehat (nilai selain 1 hanya boleh pada readiness).</p>'
    },
    {
      type: 'example',
      title: 'Deployment Lengkap: Requests, Limits, dan Ketiga Probe',
      lang: 'yaml',
      output: false,
      code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: nginx
          image: nginx:1.27-alpine
          ports:
            - containerPort: 80
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 256Mi
          startupProbe:
            httpGet:
              path: /healthz
              port: 80
            failureThreshold: 30
            periodSeconds: 2
          livenessProbe:
            httpGet:
              path: /healthz
              port: 80
            initialDelaySeconds: 5
            periodSeconds: 10
            timeoutSeconds: 2
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /ready
              port: 80
            periodSeconds: 5
            timeoutSeconds: 2
            failureThreshold: 2`,
      explain: [
        'Deployment ini menyetel requests dan limits sekaligus ketiga probe pada container yang sama.',
        'Startup probe memberi waktu hingga 60 detik (30 kegagalan dikalikan 2 detik) bagi aplikasi yang lambat bangun; liveness dan readiness baru mulai setelah startup probe berhasil.',
        'Liveness memakai endpoint /healthz yang ringan; bila tiga kali berturut-turut gagal, container di-restart.',
        'Readiness memakai /ready; bila gagal, pod tetap berjalan tetapi dikeluarkan dari Endpoints sehingga tidak menerima trafik.',
        'Dengan requests CPU 100m, Deployment ini juga sudah siap dipantau oleh HPA pada bab autoscaling.'
      ]
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 330" width="760" role="img" aria-label="Alur ketiga health probe pada pod: readiness mengatur trafik service, liveness mengatur restart container, startup melindungi aplikasi yang lambat bangun">
        <text x="380" y="30" class="u-sub" text-anchor="middle">Ketiga Probe dan Akibatnya</text>
        <rect x="30" y="130" width="170" height="86" rx="8" class="u-hd"/>
        <text x="115" y="160" class="u-title" text-anchor="middle">Service</text>
        <text x="115" y="182" class="u-lbl" text-anchor="middle">Endpoints berisi</text>
        <text x="115" y="200" class="u-lbl" text-anchor="middle">hanya pod Ready</text>
        <line x1="204" y1="173" x2="272" y2="173" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="238" y="163" class="u-lbl" text-anchor="middle">trafik</text>
        <rect x="276" y="100" width="180" height="150" rx="10" class="u-box"/>
        <text x="366" y="128" class="u-title" text-anchor="middle">Pod</text>
        <rect x="296" y="140" width="140" height="56" rx="6" class="u-hd"/>
        <text x="366" y="164" class="u-title" text-anchor="middle">Container</text>
        <text x="366" y="184" class="u-lbl" text-anchor="middle">aplikasi</text>
        <text x="366" y="222" class="u-lbl" text-anchor="middle">probe: httpGet / tcp / exec</text>
        <rect x="530" y="40" width="200" height="64" rx="8" class="u-box"/>
        <text x="630" y="66" class="u-title" text-anchor="middle">Readiness gagal</text>
        <text x="630" y="86" class="u-lbl" text-anchor="middle">dikeluarkan dari Endpoints</text>
        <line x1="456" y1="120" x2="526" y2="76" class="u-dash" marker-end="url(#u-arrow)"/>
        <rect x="530" y="140" width="200" height="64" rx="8" class="u-box"/>
        <text x="630" y="166" class="u-title" text-anchor="middle">Liveness gagal</text>
        <text x="630" y="186" class="u-lbl" text-anchor="middle">container di-restart</text>
        <line x1="456" y1="172" x2="526" y2="172" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="530" y="246" width="200" height="64" rx="8" class="u-box"/>
        <text x="630" y="272" class="u-title" text-anchor="middle">Startup probe</text>
        <text x="630" y="292" class="u-lbl" text-anchor="middle">melindungi app lambat start</text>
        <line x1="456" y1="220" x2="526" y2="270" class="u-dash" marker-end="url(#u-arrow)"/>
        <path d="M 420 250 C 420 288 300 288 300 250" class="u-dash" marker-end="url(#u-arrow)"/>
        <text x="366" y="272" class="u-lbl" text-anchor="middle">restart container</text>
        <text x="380" y="320" class="u-lbl" text-anchor="middle">Readiness mengatur trafik, Liveness mengatur restart, Startup memberi waktu aplikasi bangun</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 10.1</b> — Ketiga probe memiliki akibat berbeda; jangan tertukar saat mengonfigurasinya</figcaption></figure>`
    },
    {
      type: 'tip',
      title: 'Pisahkan Peran Probe',
      text: 'Gunakan endpoint yang sangat ringan, misalnya <code>/healthz</code> yang hanya mengembalikan 200 OK tanpa mengecek dependensi berat, untuk liveness. Pemeriksaan liveness sebaiknya mendeteksi proses yang macet, bukan ketersediaan layanan luar — untuk hal itu gunakan readiness probe.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Liveness probe yang salah konfigurasi menyebabkan restart loop: path yang salah, port keliru, atau timeout terlalu pendek membuat container sehat terus di-restart tanpa henti. Selalu uji endpoint probe secara manual sebelum menerapkannya, dan perbesar <code>initialDelaySeconds</code> atau <code>failureThreshold</code> untuk aplikasi yang butuh waktu pemanasan.'
    },
    {
      type: 'vocab',
      items: [
        ['Requests', 'Jaminan minimum kapasitas CPU atau memory yang disediakan scheduler untuk sebuah container.'],
        ['Limits', 'Batas maksimum pemakaian CPU atau memory sebuah container.'],
        ['Throttling', 'Pengereman CPU otomatis ketika container mencapai limits; proses melambat tanpa dihentikan.'],
        ['OOMKilled', 'Penghentian container oleh sistem karena pemakaian memory melewati limits, lalu di-restart oleh Kubernetes.'],
        ['QoS Class', 'Kelas Guaranteed, Burstable, atau BestEffort yang menentukan urutan prioritas pod saat node kehabisan memori.'],
        ['Liveness Probe', 'Pemeriksaan kesehatan container; bila gagal, container di-restart.'],
        ['Readiness Probe', 'Pemeriksaan kesiapan melayani trafik; bila gagal, pod dikeluarkan dari Endpoints tanpa di-restart.']
      ]
    }
  ],
  recap: [
    'Requests adalah jaminan minimum untuk scheduler; limits adalah batas maksimum pemakaian container.',
    'CPU yang berlebih memicu throttling; memory yang berlebih memicu OOMKilled lalu restart.',
    'Kelas QoS ditentukan oleh kesetaraan requests dan limits; Guaranteed bertahan paling akhir saat node kehabisan memori.',
    'Liveness me-restart container yang macet, readiness mengeluarkan pod dari Endpoints, dan startup memberi waktu aplikasi yang lambat bangun.'
  ]
});
