/* ============================================================
   Pelajaran Kubernetes — Bab 5: StatefulSet, DaemonSet, Job & CronJob
   ============================================================ */
'use strict';

window.KUBERNETES_LESSONS = window.KUBERNETES_LESSONS || [];

window.KUBERNETES_LESSONS.push({
  id: 'workload-lanjutan',
  title: 'StatefulSet, DaemonSet, Job & CronJob',
  chapter: 'Objek Inti',
  duration: '10–12 menit',
  intro: [
    'Kamu sudah bisa mendeploy aplikasi web dengan Deployment dan tidur dengan tenang — sampai diminta meng-deploy PostgreSQL, memasang agen log di setiap node, atau menjalankan proses backup tiap malam. Memaksa ketiga pekerjaan itu ke dalam Deployment adalah resep masalah.',
    'Kubernetes menyediakan controller khusus untuk tiap kebutuhan: <b>StatefulSet</b> untuk beban kerja yang membutuhkan identitas dan penyimpanan stabil, <b>DaemonSet</b> untuk pod yang wajib ada di setiap node, serta <b>Job</b> dan <b>CronJob</b> untuk pekerjaan sekali jalan dan berjadwal.',
    'Setelah bab ini kamu akan bisa memilih controller yang tepat, membaca manifest masing-masing, dan tahu field wajib apa yang harus diperhatikan agar objeknya benar-benar berfungsi.'
  ],
  objectives: [
    'Menentukan kapan Deployment sudah cukup dan kapan butuh controller lain',
    'Memahami identitas stabil, headless Service, dan volume per Pod pada StatefulSet',
    'Mengonfigurasi DaemonSet untuk agen node seperti logging dan monitoring',
    'Menulis Job dan CronJob beserta jadwal, batas percobaan, dan kebijakan konkurensi'
  ],
  sections: [
    {
      type: 'text',
      html: `<h3>Memilih Controller yang Tepat</h3><p>Untuk aplikasi stateless (web API, worker tanpa data lokal), <b>Deployment</b> sudah lebih dari cukup: pod bisa dibuat, diganti, dan dibuang kapan saja tanpa konsekuensi. Namun beberapa beban kerja punya kebutuhan yang tidak bisa dipenuhi ReplicaSet, karena itu Kubernetes menyediakan empat controller lain:</p><ul><li><b>StatefulSet</b> — Pod bernama stabil (web-0, web-1), urutan start/stop terprediksi, dan volume khusus per Pod; standar untuk database seperti PostgreSQL dan MySQL.</li><li><b>DaemonSet</b> — menjamin tepat satu Pod berjalan di setiap node; cocok untuk agen log (Fluentd, Promtail), node-exporter, atau device plugin GPU.</li><li><b>Job</b> — menjalankan satu pekerjaan sampai selesai, lalu berhenti (restartPolicy OnFailure atau Never).</li><li><b>CronJob</b> — membuat Job secara berkala mengikuti jadwal cron, misalnya backup harian.</li></ul><figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Perbandingan empat controller: Deployment dengan pod nama acak, StatefulSet dengan nama stabil, DaemonSet menempel tiap node, CronJob membuat Job berjadwal">
        <rect x="25" y="40" width="160" height="42" rx="8" class="u-hd"/>
        <text x="105" y="66" class="u-title" text-anchor="middle">Deployment web</text>
        <line x1="105" y1="82" x2="105" y2="100" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="25" y="104" width="160" height="34" rx="6" class="u-box"/>
        <text x="105" y="126" class="u-title" text-anchor="middle">pod xk2f</text>
        <rect x="25" y="146" width="160" height="34" rx="6" class="u-box"/>
        <text x="105" y="168" class="u-title" text-anchor="middle">pod pq9d</text>
        <rect x="25" y="188" width="160" height="34" rx="6" class="u-box"/>
        <text x="105" y="210" class="u-title" text-anchor="middle">pod zz1a</text>
        <text x="105" y="248" class="u-lbl" text-anchor="middle">stateless · nama pod diacak</text>
        <text x="105" y="266" class="u-lbl" text-anchor="middle">pod bisa dibuat ulang bebas</text>
        <rect x="210" y="40" width="160" height="42" rx="8" class="u-hd"/>
        <text x="290" y="66" class="u-title" text-anchor="middle">StatefulSet web</text>
        <line x1="290" y1="82" x2="290" y2="100" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="210" y="104" width="160" height="34" rx="6" class="u-box"/>
        <text x="290" y="126" class="u-title" text-anchor="middle">web-0 + PVC-0</text>
        <rect x="210" y="146" width="160" height="34" rx="6" class="u-box"/>
        <text x="290" y="168" class="u-title" text-anchor="middle">web-1 + PVC-1</text>
        <rect x="210" y="188" width="160" height="34" rx="6" class="u-box"/>
        <text x="290" y="210" class="u-title" text-anchor="middle">web-2 + PVC-2</text>
        <text x="290" y="248" class="u-lbl" text-anchor="middle">identitas &amp; storage stabil</text>
        <text x="290" y="266" class="u-lbl" text-anchor="middle">start/stop berurutan</text>
        <rect x="395" y="40" width="160" height="42" rx="8" class="u-hd"/>
        <text x="475" y="66" class="u-title" text-anchor="middle">DaemonSet agent</text>
        <line x1="475" y1="82" x2="475" y2="100" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="395" y="104" width="160" height="34" rx="6" class="u-box"/>
        <text x="475" y="126" class="u-title" text-anchor="middle">Node A + agent</text>
        <rect x="395" y="146" width="160" height="34" rx="6" class="u-box"/>
        <text x="475" y="168" class="u-title" text-anchor="middle">Node B + agent</text>
        <rect x="395" y="188" width="160" height="34" rx="6" class="u-box"/>
        <text x="475" y="210" class="u-title" text-anchor="middle">Node C + agent</text>
        <text x="475" y="248" class="u-lbl" text-anchor="middle">tepat 1 pod per node</text>
        <text x="475" y="266" class="u-lbl" text-anchor="middle">mengikuti node baru</text>
        <rect x="580" y="40" width="160" height="42" rx="8" class="u-hd"/>
        <text x="660" y="66" class="u-title" text-anchor="middle">CronJob backup</text>
        <line x1="660" y1="82" x2="660" y2="100" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="580" y="104" width="160" height="34" rx="6" class="u-box"/>
        <text x="660" y="126" class="u-title" text-anchor="middle">Job 02:00</text>
        <rect x="580" y="146" width="160" height="34" rx="6" class="u-box"/>
        <text x="660" y="168" class="u-title" text-anchor="middle">Job 02:00+1 hari</text>
        <rect x="580" y="188" width="160" height="34" rx="6" class="u-box"/>
        <text x="660" y="210" class="u-title" text-anchor="middle">Job 02:00+2 hari</text>
        <text x="660" y="248" class="u-lbl" text-anchor="middle">pekerjaan terjadwal</text>
        <text x="660" y="266" class="u-lbl" text-anchor="middle">membuat Job berkala</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 5.1</b> — Empat controller dengan pola penempatan Pod yang berbeda: bebas, bernama stabil, menempel per node, atau berjadwal</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'StatefulSet PostgreSQL dengan Headless Service',
      lang: 'yaml',
      output: false,
      code: `apiVersion: v1
kind: Service
metadata:
  name: postgres-hl
spec:
  clusterIP: None               # headless: DNS per pod, bukan 1 IP layanan
  selector:
    app: postgres
  ports:
    - port: 5432
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres-hl      # wajib menunjuk ke headless service
  replicas: 2
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:16
          ports:
            - containerPort: 5432
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:         # membuat 1 PVC per pod: postgres-0, postgres-1
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 1Gi`,
      explain: [
        'Pod StatefulSet selalu bernama urut (postgres-0, postgres-1) dan nama ini tidak berubah walau pod dipindah node — setiap pod mendapat DNS stabil dari headless Service (postgres-0.postgres-hl).',
        'volumeClaimTemplates membuat PersistentVolumeClaim terpisah untuk tiap pod, sehingga data PostgreSQL tetap menempel pada pod yang sama saat di-recreate.',
        'Start dan stop berjalan berurutan dari indeks tertinggi, aman untuk klaster database yang punya anggota "leader" dan "follower".',
        'Catatan penting: StatefulSet tidak membuat storage otomatis — cluster harus punya StorageClass/penyedia PVC aktif, kalau tidak pod akan stuck Pending.'
      ]
    },
    {
      type: 'text',
      html: '<h3>DaemonSet: Satu Pod di Setiap Node</h3><p>Bayangkan agen pengumpul log atau exporter metrik: harus berjalan di <b>setiap</b> node, tidak lebih dan tidak kurang. Dengan Deployment kamu harus menghitung jumlah node secara manual, dan setiap kali node baru ditambahkan kamu harus mengubah manifest.</p><p><b>DaemonSet</b> menyelesaikannya otomatis: begitu sebuah node bergabung ke cluster, DaemonSet membuat satu Pod di node tersebut; ketika node dikeluarkan, Pod-nya ikut dihapus. Kasus penggunaan paling umum:</p><ul><li>Agen logging dan observasi: Fluentd, Promtail, atau Filebeat.</li><li>Monitoring node: node-exporter untuk Prometheus.</li><li>Device plugin GPU atau runtime khusus di node tertentu.</li></ul><p>Karena sering harus berjalan juga di node control-plane yang punya taint, DaemonSet hampir selalu membutuhkan <code>tolerations</code> dengan <code>operator: Exists</code>.</p>'
    },
    {
      type: 'example',
      title: 'DaemonSet node-exporter',
      lang: 'yaml',
      output: false,
      code: `apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-exporter
spec:
  selector:
    matchLabels:
      app: node-exporter
  template:
    metadata:
      labels:
        app: node-exporter
    spec:
      hostNetwork: true           # memakai jaringan node langsung
      tolerations:
        - operator: Exists        # ikut juga di node bertaint (control-plane)
      containers:
        - name: node-exporter
          image: quay.io/prometheus/node-exporter:v1.8.2
          ports:
            - containerPort: 9100`,
      explain: [
        'DaemonSet tidak punya field replicas; jumlah pod selalu sama dengan jumlah node yang lolos filter (nodeSelector/affinity) dan diperbolehkan oleh tolerations.',
        'hostNetwork: true membuat pod memakai IP dan port node, sehingga metrik node bisa diakses langsung di port 9100 tanpa Service tambahan.',
        'Ketika node baru ditambahkan, DaemonSet otomatis menempatkan satu pod baru di sana tanpa intervensi manual.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Job & CronJob: Pekerjaan Sekali Jalan dan Berjadwal</h3><p>Deployment dirancang agar pod berjalan selamanya; untuk pekerjaan yang harus <b>selesai</b> (backup, migrasi database, kirim laporan) gunakan <b>Job</b>. Bedanya ada pada <code>restartPolicy</code> yang hanya boleh OnFailure atau Never, ditambah field khas batch:</p><ul><li><b>spec.completions</b> — berapa banyak pod yang harus berhasil diselesaikan.</li><li><b>spec.parallelism</b> — berapa banyak pod yang boleh berjalan bersamaan.</li><li><b>spec.backoffLimit</b> — batas jumlah percobaan ulang sebelum Job dinyatakan gagal.</li></ul><p>Pantau Job sampai selesai dengan <code>kubectl wait --for=condition=complete job/&lt;nama&gt; --timeout=300s</code>, dan lihat hasilnya lewat <code>kubectl get jobs</code>. Untuk pekerjaan berulang, bungkus Job dalam <b>CronJob</b> yang memegang field <code>schedule</code> (sintaks cron lima kolom), <code>concurrencyPolicy</code> (Allow, Forbid, atau Replace), dan <code>jobTemplate</code> berisi spesifikasi Job yang akan dibuatnya.</p>'
    },
    {
      type: 'example',
      title: 'CronJob Backup Harian',
      lang: 'yaml',
      output: false,
      code: `apiVersion: batch/v1
kind: CronJob
metadata:
  name: backup-harian
spec:
  schedule: "17 2 * * *"          # tiap hari pukul 02.17 (zona waktu cluster)
  concurrencyPolicy: Forbid       # run berikutnya menunggu run selesai
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 3
  jobTemplate:                   # spesifikasi Job yang dibuat sesuai jadwal
    spec:
      backoffLimit: 2             # maksimal 3 percobaan (1 awal + 2 ulang)
      template:
        spec:
          restartPolicy: Never
          containers:
            - name: backup
              image: bitnami/postgresql:16
              command: ["/bin/sh", "-c"]
              args: ["pg_dump -h postgres-hl -U app db > /backup/db.sql"]`,
      explain: [
        'Setiap kali jadwal tiba, CronJob membuat satu objek Job dari jobTemplate; Job itulah yang membuat pod dan memantaunya sampai selesai.',
        'concurrencyPolicy: Forbid mencegah backup lama masih berjalan ketika jadwal berikutnya datang — pilihan tepat untuk pekerjaan yang tidak boleh tumpang tindih (alternatifnya Allow atau Replace).',
        'Dengan restartPolicy: Never dan backoffLimit: 2, kegagalan pod tidak diulang oleh kubelet, melainkan dicoba ulang oleh Job hingga batas percobaan habis.',
        'Untuk pengujian, jalankan sekali tanpa menunggu jadwal dengan kubectl create job --from=cronjob/backup-harian backup-manual.'
      ]
    },
    {
      type: 'tip',
      title: 'Zona Waktu Jadwal Cron',
      text: 'Field schedule memakai zona waktu cluster, yaitu UTC secara bawaan. Jadwal "17 2 * * *" berarti 02.17 UTC (09.17 WIB). Untuk zona waktu lain, isi field spec.timezone pada CronJob (fitur stabil sejak Kubernetes 1.27) misalnya "Asia/Jakarta", dan pastikan zona tersebut tersedia di node.'
    },
    {
      type: 'warn',
      title: 'StatefulSet Tidak Otomatis Membuat Storage',
      text: 'volumeClaimTemplates hanya berhasil bila cluster memiliki StorageClass atau provisioner PVC yang aktif; tanpa itu pod akan stuck di Pending selamanya. Selain itu, field serviceName wajib menunjuk ke headless Service (clusterIP: None) — tanpa itu DNS per Pod tidak terbentuk dan anggota klaster tidak bisa saling menemukan.'
    },
    {
      type: 'vocab',
      items: [
        ['StatefulSet', 'Controller untuk beban kerja dengan nama Pod stabil, urutan start/stop, dan volume khusus per Pod.'],
        ['Headless Service', 'Service dengan clusterIP: None yang memberi DNS per Pod, bukan satu IP layanan tunggal.'],
        ['DaemonSet', 'Controller yang menjamin tepat satu Pod berjalan di setiap node yang memenuhi seleksi.'],
        ['Job', 'Objek yang menjalankan satu pekerjaan sampai selesai dengan restartPolicy OnFailure atau Never.'],
        ['CronJob', 'Objek yang membuat Job secara berkala sesuai jadwal cron.'],
        ['backoffLimit', 'Field Job yang membatasi jumlah percobaan pod sebelum pekerjaan dinyatakan gagal.']
      ]
    }
  ],
  recap: [
    'Deployment cukup untuk aplikasi stateless; pilih controller lain sesuai kebutuhan: StatefulSet, DaemonSet, Job, atau CronJob.',
    'StatefulSet memberi nama Pod stabil, headless Service untuk DNS per Pod, dan volume khusus per Pod — butuh PVC/StorageClass aktif.',
    'DaemonSet menempatkan tepat satu Pod di setiap node, cocok untuk agen logging, monitoring, dan device plugin.',
    'Job menyelesaikan pekerjaan sekali jalan (completions, parallelism, backoffLimit); CronJob membuat Job mengikuti jadwal cron dengan concurrencyPolicy tertentu.'
  ]
});
