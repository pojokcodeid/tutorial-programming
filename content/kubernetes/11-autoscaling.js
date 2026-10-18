/* ============================================================
   Pelajaran Kubernetes — Bab 11: Autoscaling — HPA & VPA
   ============================================================ */
'use strict';

window.KUBERNETES_LESSONS = window.KUBERNETES_LESSONS || [];

window.KUBERNETES_LESSONS.push({
  id: 'autoscaling',
  title: 'Autoscaling: HPA & VPA',
  chapter: 'Skala & Keandalan',
  duration: '8–10 menit',
  intro: [
    'Trafik aplikasi web tidak pernah datar: ramai di jam kerja, sepi tengah malam. Menentukan jumlah replica secara tetap selalu berakhir buruk — terlalu sedikit saat ramai sehingga layanan melambat, atau terlalu banyak saat sepi sehingga biaya membengkak. Manual scaling pun melelahkan dan selalu terlambat.',
    '<b>Autoscaling</b> menyerahkan keputusan itu kepada Kubernetes. <b>HPA</b> (Horizontal Pod Autoscaler) menyesuaikan jumlah pod berdasarkan metrik seperti pemakaian CPU, sedangkan <b>VPA</b> (Vertical Pod Autoscaler) menyesuaikan ukuran pod berupa requests dan limits. Keduanya sama-sama bergantung pada data metrik yang akurat.',
    'Pada bab ini kamu akan memasang dan memverifikasi metrics-server, membuat HPA lewat perintah singkat maupun manifest lengkap dengan pengaturan perilaku scaling, memahami rumus dan syarat kerja HPA, serta mengenal VPA beserta batas penggunaannya.'
  ],
  objectives: [
    'Memahami peran metrics-server sebagai sumber metrik bawaan cluster',
    'Membuat dan memantau HPA lewat kubectl autoscale maupun manifest autoscaling/v2',
    'Menghitung hasil scaling dengan rumus sederhana HPA dan memahami syarat requests',
    'Mengenal mode dan komponen VPA beserta batasan pemakaiannya bersama HPA'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>metrics-server: Sumber Metrik Bawaan</h3><p>Sebelum bisa menyesuaikan, Kubernetes harus bisa mengukur. <b>metrics-server</b> adalah komponen cluster yang mengumpulkan penggunaan CPU dan memory dari kubelet di setiap node, lalu menyajikannya lewat <b>Metrics API</b> bernama <code>v1beta1.metrics.k8s.io</code>. Metrics-server hanya menyimpan angka terkini, bukan penyimpan metrik jangka panjang seperti Prometheus.</p><p>Tanpa metrics-server, perintah <code>kubectl top</code> dan HPA tidak dapat bekerja. Di minikube, metrics-server dipasang sangat mudah lewat addon, dan kesiapannya bisa diverifikasi lewat <code>kubectl get apiservice v1beta1.metrics.k8s.io</code> yang harus menampilkan kolom Available: True.</p>'
    },
    {
      type: 'example',
      title: 'Pasang dan Verifikasi metrics-server di Minikube',
      lang: 'bash',
      output: false,
      code: `# Aktifkan metrics-server lewat addon minikube
minikube addons enable metrics-server

# Tunggu satu sampai dua menit hingga addon siap, lalu uji
kubectl top pods
kubectl top nodes

# Pastikan Metrics API tersedia di cluster
kubectl get apiservice v1beta1.metrics.k8s.io`,
      explain: [
        'Metrics API disediakan lewat objek APIService bernama v1beta1.metrics.k8s.io; kolom Available harus berisi True.',
        '<code>kubectl top pods</code> menampilkan pemakaian aktual per pod, sedangkan <code>kubectl top nodes</code> per node.',
        'Bila kedua perintah tadi gagal dengan pesan metrics API tidak tersedia, addon belum siap atau belum terpasang.',
        'Angka inilah yang nantinya dipakai HPA untuk menghitung keputusan scaling.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Horizontal Pod Autoscaler (HPA)</h3><p>HPA menyesuaikan <b>jumlah pod</b> pada Deployment atau StatefulSet berdasarkan metrik. Perintah tersempat membuat HPA dalam satu baris: <code>kubectl autoscale deployment web --cpu-percent=60 --min=2 --max=10</code>. Perintah itu menjaga rata-rata pemakaian CPU tetap di sekitar 60 persen, dengan minimal 2 pod dan maksimal 10 pod.</p><p>Di balik layar, HPA menghitung jumlah pod yang diinginkan dengan rumus sederhana: <code>desiredReplicas = ceil(currentReplicas × currentUtilization / targetUtilization)</code>. Misalnya 3 pod dengan utilisasi rata-rata 78 persen dan target 60 persen menghasilkan ceil(3 × 78 / 60) = 4 pod.</p><p>Syarat mutlaknya: <b>setiap container harus memiliki requests</b> pada resource yang dipantau. Tanpa requests CPU, utilisasi tidak dapat dihitung dan HPA berhenti bekerja. Perilaku scaling diatur lewat field <code>behavior</code>: scale up dipercepat, sedangkan scale down ditahan selama <code>stabilizationWindowSeconds</code> agar pod tidak langsung dikurangi ketika trafik turun sesaat. Kebijakan (policies) membatasi langkah perubahannya, misalnya maksimal 100 persen pod per 15 detik saat menaikkan dan 1 pod per 60 detik saat menurunkan.</p><h3>Vertical Pod Autoscaler (VPA)</h3><p>Bila HPA menambah jumlah pod, <b>VPA</b> menyesuaikan <b>ukuran pod</b> berupa requests dan limits. VPA memiliki tiga komponen: <b>Recommender</b> yang menghitung rekomendasi dari riwayat pemakaian, <b>Updater</b> yang membuat ulang pod dengan nilai baru, dan <b>Admission Controller</b> yang menerapkan nilai saat pod baru dibuat. Mode yang tersedia: <code>Off</code> (hanya memberi rekomendasi), <code>Initial</code> (menerapkan saat pod dibuat pertama kali), dan <code>Recreate</code> (mematikan lalu membuat ulang pod dengan nilai baru).</p><p><b>Batasan penting:</b> jangan mengatur CPU HPA dan VPA Updater pada resource yang sama secara bersamaan, karena keduanya berebut peran. HPA menambah pod ketika CPU tinggi, sementara VPA justru memperkecil kuota CPU tiap pod sehingga keduanya saling memicu. Untuk penggunaan aman, pakai VPA pada memory, atau ubah HPA untuk memantau metrik lain selama VPA mode Recreate aktif.</p><h3>Langkah Lanjut</h3><ul><li><b>Custom metrics</b> — metrik aplikasi seperti permintaan per detik, disediakan lewat Prometheus Adapter.</li><li><b>External metrics</b> — panjangnya antrian seperti SQS atau Kafka, umumnya diakses lewat <b>KEDA</b>.</li><li><b>Cluster Autoscaler</b> dan <b>Karpenter</b> — menambah atau mengurangi <b>jumlah node</b> ketika pod tidak lagi muat atau kapasitas node menganggur.</li></ul>'
    },
    {
      type: 'example',
      title: 'Manifest HPA v2 dengan Pengaturan Perilaku Scaling',
      lang: 'yaml',
      output: false,
      code: `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 60
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Pods
          value: 1
          periodSeconds: 60`,
      explain: [
        'API autoscaling/v2 adalah versi stabil HPA; scaleTargetRef menunjuk Deployment yang jumlah podnya diatur.',
        'Metrik bertipe Resource dengan target Utilization 60 berarti HPA menjaga rata-rata pemakaian CPU tetap 60 persen dari nilai requests.',
        'Scale up memakai kebijakan Persen 100 per 15 detik sehingga pod bisa berlipat cepat saat lonjakan trafik.',
        'Scale down ditahan 300 detik dan hanya mengurangi 1 pod per 60 detik agar tidak labil ketika trafik turun sesaat.',
        'Manifest ini setara dengan kubectl autoscale di atas, tetapi memungkinkan pengaturan behavior yang lebih rinci.'
      ]
    },
    {
      type: 'example',
      title: 'Manifest VPA dengan Mode Initial',
      lang: 'yaml',
      output: false,
      code: `apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: web
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web
  updatePolicy:
    updateMode: "Initial"`,
      explain: [
        'VPA memakai API autoscaling.k8s.io/v1 dan menunjuk objek yang sama dengan HPA, tetapi hasilnya berupa rekomendasi requests dan limits, bukan perubahan jumlah pod.',
        'Mode Initial menerapkan nilai rekomendasi hanya saat pod dibuat pertama kali; ganti ke Off untuk sekadar melihat rekomendasi lewat <code>kubectl describe vpa web</code>, atau Recreate agar pod dibuat ulang dengan nilai baru.',
        'Objek VPA hanya bisa dibuat setelah komponen VPA (recommender, updater, dan admission controller) dipasang dari repositori kubernetes/autoscaler.',
        'Hindari mengaktifkan mode Recreate pada CPU bersamaan dengan HPA CPU pada Deployment yang sama karena keduanya saling bertentangan.'
      ]
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Alur autoscaling HPA dari pengumpulan metrik oleh metrics-server, Metrics API, HPA controller, hingga perubahan jumlah pod">
        <text x="380" y="28" class="u-sub" text-anchor="middle">Alur HPA: dari Metrik ke Jumlah Pod</text>
        <rect x="20" y="90" width="150" height="84" rx="8" class="u-hd"/>
        <text x="95" y="118" class="u-title" text-anchor="middle">Node &amp; Pod</text>
        <text x="95" y="142" class="u-lbl" text-anchor="middle">Deployment web</text>
        <text x="95" y="160" class="u-lbl" text-anchor="middle">CPU rata-rata 78%</text>
        <rect x="200" y="90" width="150" height="84" rx="8" class="u-box"/>
        <text x="275" y="118" class="u-title" text-anchor="middle">metrics-server</text>
        <text x="275" y="142" class="u-lbl" text-anchor="middle">kumpulkan dari</text>
        <text x="275" y="160" class="u-lbl" text-anchor="middle">kubelet tiap node</text>
        <rect x="380" y="90" width="160" height="84" rx="8" class="u-hd"/>
        <text x="460" y="118" class="u-title" text-anchor="middle">kube-apiserver</text>
        <text x="460" y="142" class="u-lbl" text-anchor="middle">Metrics API</text>
        <text x="460" y="160" class="u-lbl" text-anchor="middle">v1beta1.metrics.k8s.io</text>
        <rect x="560" y="90" width="180" height="84" rx="8" class="u-box"/>
        <text x="650" y="114" class="u-title" text-anchor="middle">HPA controller</text>
        <text x="650" y="138" class="u-lbl" text-anchor="middle">ceil(3 × 78 / 60) = 4</text>
        <text x="650" y="156" class="u-lbl" text-anchor="middle">batas min 2 … max 10</text>
        <line x1="170" y1="132" x2="196" y2="132" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="183" y="80" class="u-lbl" text-anchor="middle">metrik</text>
        <line x1="350" y1="132" x2="376" y2="132" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="363" y="80" class="u-lbl" text-anchor="middle">metrik</text>
        <line x1="540" y1="132" x2="556" y2="132" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="548" y="80" class="u-lbl" text-anchor="middle">putusan</text>
        <path d="M 650 174 L 650 248 L 95 248 L 95 180" class="u-dash" marker-end="url(#u-arrow)"/>
        <text x="372" y="238" class="u-lbl" text-anchor="middle">ubah jumlah replica: scale up / scale down</text>
        <text x="380" y="284" class="u-lbl" text-anchor="middle">Syarat wajib: setiap container harus punya requests pada resource yang dipantau</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 11.1</b> — HPA membaca metrik dari Metrics API, menghitung target, lalu mengubah jumlah pod</figcaption></figure>`
    },
    {
      type: 'tip',
      title: 'Mulai Sederhana',
      text: 'Pasang dulu HPA CPU pada 60 persen dengan min 2 pod dan pantau beberapa jam sebelum menambah metrik lain. Gunakan <code>stabilizationWindowSeconds</code> pada scale down agar pod tidak dikurangi hanya karena trafik turun sesaat; untuk beban berbasis antrian yang sulit diprediksi, lanjutkan ke custom metrics atau KEDA.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Tanpa metrics-server, <code>kubectl top</code> dan HPA gagal dengan pesan metrics API tidak tersedia. Gejalanya: kolom TARGETS pada <code>kubectl get hpa</code> menampilkan &lt;unknown&gt; dan HPA tidak pernah melakukan scaling. Selalu verifikasi <code>kubectl get apiservice v1beta1.metrics.k8s.io</code> menunjukkan Available: True sebelum mengandalkan autoscaling.'
    },
    {
      type: 'vocab',
      items: [
        ['metrics-server', 'Komponen cluster yang mengumpulkan pemakaian CPU dan memory dari kubelet lalu menyajikannya lewat Metrics API.'],
        ['Metrics API', 'API bawaan bertipe v1beta1.metrics.k8s.io yang menyediakan angka pemakaian terkini bagi kubectl top dan HPA.'],
        ['HPA', 'Horizontal Pod Autoscaler; mengubah jumlah pod berdasarkan metrik seperti utilisasi CPU atau memory.'],
        ['VPA', 'Vertical Pod Autoscaler; menyesuaikan requests dan limits pod berdasarkan riwayat pemakaian.'],
        ['stabilizationWindowSeconds', 'Rentang waktu untuk menahan perubahan agar scaling, khususnya scale down, tidak labil.'],
        ['Cluster Autoscaler', 'Komponen yang menambah atau mengurangi jumlah node ketika pod tidak muat atau kapasitas menganggur.']
      ]
    }
  ],
  recap: [
    'Autoscaling menyesuaikan jumlah pod lewat HPA atau ukuran pod lewat VPA, keduanya bergantung pada metrik yang terukur.',
    'metrics-server menyediakan Metrics API bawaan; tanpanya kubectl top dan HPA tidak berfungsi.',
    'HPA mensyaratkan requests pada resource yang dipantau, dengan rumus desiredReplicas = ceil(currentReplicas × currentUtilization / targetUtilization).',
    'Field behavior.scaleDown dengan stabilizationWindowSeconds mencegah scaling turun yang labil, dan VPA tidak boleh aktif bersama HPA CPU pada resource yang sama.'
  ]
});
