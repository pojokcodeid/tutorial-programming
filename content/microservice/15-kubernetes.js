/* ============================================================
   Pelajaran Microservices — Bab 15: Deploy ke Kubernetes
   ============================================================ */
'use strict';

window.MICROSERVICE_LESSONS = window.MICROSERVICE_LESSONS || [];

window.MICROSERVICE_LESSONS.push({
  id: 'kubernetes-deployment',
  title: 'Kubernetes: Deployment, Probe, dan Rolling Update',
  chapter: 'Operasional & Proyek',
  duration: '14–16 menit',
  intro: [
    'Docker Compose memakai satu komputer: kalau mesinnya mati, semua kontainer mati bersamanya, dan menambah replika berarti menyalin konfigurasi secara manual. <b>Kubernetes (K8s)</b> menaikkan levelnya: ia mengelola sekumpulan mesin sebagai satu <b>cluster</b>, lalu menempatkan kontainermu di mesin mana pun yang tersedia — dan bila sebuah mesin mati, pod dipindahkan sendiri ke mesin sehat tanpa campur tanganmu.',
    'Yang membuat Kubernetes cocok untuk microservices adalah bahasa konfigurasinya yang deklaratif: kamu menuliskan keinginan (dua replika catalog-service, batas memori 256 Mi, probe siap lewat <code>/readyz</code>) dalam berkas YAML, lalu cluster bekerja terus-menerus agar kenyataan selaras dengan keinginan itu. Replika bertambah saat trafik naik, pod diganti saat container crash, dan update dirilis tanpa downtime lewat <b>rolling update</b>.',
    'Bab ini mendaratkan catalog-service ke cluster: mulai dari konsep inti cluster–node–pod, Deployment dengan resource requests dan limits, perbedaan krusial antara readiness probe dan liveness probe, Service ClusterIP, ConfigMap dan Secret, Ingress berbasis host, autoscaling singkat, hingga perintah kubectl harian dan gambaran Helm serta Kustomize.'
  ],
  objectives: [
    'Menjelaskan hubungan cluster, node, pod, Deployment, dan Service',
    'Menulis manifest Deployment catalog-service dengan dua replika dan batas resource',
    'Membedakan readiness probe dari liveness probe beserta konsekuensinya',
    'Mengonfigurasi ClusterIP, ConfigMap, Secret, dan Ingress berbasis host',
    'Menjalankan rolling update dan rollback memakai kubectl'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Cluster, Node, Pod</h3><p><b>Cluster</b> adalah kumpulan mesin (bare metal atau VM) yang dikelola bersama oleh Kubernetes. Setiap mesin di dalamnya disebut <b>node</b>: minimal satu <i>control plane</i> (dulu disebut master) yang menjalankan API server dan pengambil keputusan, serta beberapa <i>worker node</i> tempat beban berjalan. Satu unit kerja terkecil di worker adalah <b>pod</b> — kemasan berisi satu atau beberapa container yang selalu dijadwalkan bersama dan berbagi jaringan yang sama; <code>localhost</code> di dalam pod menunjuk antarcontainer dalam pod itu.</p><p>Pod diperlakukan sebagai <b>benda sekali pakai</b>: bila pod mati, ia tidak "dihidupkan kembali" melainkan diganti dengan pod baru yang identik. Karena itu konfigurasi dan data tidak boleh disimpan di dalam pod. Dua objek yang mengatur pod dalam praktik sehari-hari: <b>Deployment</b> (mempertahankan sejumlah replika pod, mengurus update dan rollback) dan <b>Service</b> (alamat stabil agar pod yang silih berganti tetap bisa dihubungi). Seluruh objek dikelompokkan ke dalam <b>namespace</b> — di OMS kita memakai namespace <code>oms</code> untuk produksi dan <code>oms-dev</code> untuk lingkungan pengembangan.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Namespace, ConfigMap, Secret, dan Deployment catalog-service',
      lang: 'yaml',
      output: false,
      code: `apiVersion: v1
kind: Namespace
metadata:
  name: oms
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: catalog-config
  namespace: oms
data:
  HTTP_PORT: "8081"
  DB_HOST: catalog-db
  DB_NAME: catalog_db
  LOG_LEVEL: info
---
apiVersion: v1
kind: Secret
metadata:
  name: catalog-db-credentials
  namespace: oms
type: Opaque
stringData:            # nilai asli; K8s mengenkripsi bila storage-nya mendukung
  DB_USER: catalog
  DB_PASSWORD: ganti-dengan-nilai-asli
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: catalog
  namespace: oms
  labels:
    app: catalog
spec:
  replicas: 2
  revisionHistoryLimit: 5       # simpan 5 revisi lama untuk rollback
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1                # maksimal 1 pod melebihi target
      maxUnavailable: 0          # tanpa downtime: pod lama baru hilang setelah pod baru sehat
  selector:
    matchLabels:
      app: catalog               # harus cocok dengan label pod di bawah
  template:
    metadata:
      labels:
        app: catalog             # label ini dipakai Service dan kube-proxy
    spec:
      containers:
        - name: catalog
          image: ghcr.io/example/oms-catalog:3f9a1c2
          ports:
            - containerPort: 8081
              name: http
          envFrom:
            - configMapRef:
                name: catalog-config
            - secretRef:
                name: catalog-db-credentials
          resources:
            requests:            # klaim minimum; dasar penjadwalan pod
              cpu: 100m          # 0,1 inti
              memory: 128Mi
            limits:              # batas maksimum; memori melebihi ini = pod di-kill
              cpu: 500m
              memory: 256Mi
          readinessProbe:
            httpGet:
              path: /readyz
              port: http
            initialDelaySeconds: 3
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /healthz
              port: http
            initialDelaySeconds: 10
            periodSeconds: 15`,
      explain: [
        '<b>ConfigMap</b> untuk konfigurasi non-sensibel dan <b>Secret</b> untuk kredensial; keduanya disuntikkan sebagai environment variable sehingga kode Go cukup membaca <code>os.Getenv</code> tanpa berubah.',
        '<code>maxUnavailable: 0</code> bersama <code>maxSurge: 1</code> adalah resep rolling update tanpa downtime: pod baru dibuat lebih dulu, dan pod lama baru dihentikan setelah pod baru ready.',
        '<code>requests</code> menentukan ke mana pod dijadwalkan — node dengan sisa CPU kurang dari 100m tidak akan dipilih. <code>limits</code> membatasi; CPU dibatasi berupa throttling, memori yang melebihi limit menyebabkan container di-<i>kill</i> (OOMKilled).',
        'Probe memakai nama port bernama <code>http</code>, bukan angka — bila port dipindahkan di kode, manifest tidak perlu diubah.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Readiness Probe vs Liveness Probe</h3><p>Kesalahan paling mahal saat pemula adalah memakai satu probe untuk dua pertanyaan yang berbeda. <b>Liveness</b> bertanya "apakah proses masih sehat?" — jawaban tidak selama beruntun membuat container <b>di-restart</b>. <b>Readiness</b> bertanya "apakah pod ini boleh menerima trafik sekarang?" — jawaban tidak membuat pod <b>dikeluarkan dari endpoint Service</b>, tetapi pod tetap hidup dan kembali menerima trafik begitu menjawab ya. Bila keduanya disatukan ke <code>/healthz</code> yang ikut memeriksa koneksi database, satu gangguan database singkat akan memicu restart massal pod yang justru memperparah keadaan.</p><table><thead><tr><th></th><th>Readiness (/readyz)</th><th>Liveness (/healthz)</th></tr></thead><tbody><tr><td><b>Pertanyaan</b></td><td>Siap dilayani sekarang?</td><td>Proses masih waras?</td></tr><tr><td><b>Saat gagal</b></td><td>Keluar dari Service (trafik berhenti)</td><td>Container di-restart</td></tr><tr><td><b>Memeriksa</b></td><td>Koneksi DB, migrasi, warmup cache</td><td>Hanya kondisi internal proses</td></tr><tr><td><b>Sifat</b></td><td>Sementara, boleh bolak-balik</td><td>Harus jarang; sering berarti bug</td></tr></tbody></table><p>Di Go, <code>/healthz</code> cukup mengembalikan 200 selama proses berjalan, sedangkan <code>/readyz</code> melakukan <code>PingContext</code> ringan ke database dengan timeout kecil. Untuk aplikasi yang lambat start, tambahkan <b>startup probe</b> yang memberi waktu awal sebelum liveness diaktifkan — daripada menebak-nebak <code>initialDelaySeconds</code> yang terlalu kecil.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Service ClusterIP dan Ingress berbasis host',
      lang: 'yaml',
      output: false,
      code: `apiVersion: v1
kind: Service
metadata:
  name: catalog
  namespace: oms
spec:
  type: ClusterIP              # hanya bisa diakses di dalam cluster
  selector:
    app: catalog               # menarik semua pod berlabel ini
  ports:
    - name: http
      port: 80                 # alamat yang dipakai service lain
      targetPort: http         # diteruskan ke containerPort bernama http
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: oms-ingress
  namespace: oms
spec:
  rules:
    - host: catalog.dev.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: catalog
                port:
                  number: 80
    - host: order.dev.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: order
                port:
                  number: 80`,
      explain: [
        'Service ClusterIP adalah <b>virtual IP</b> yang menyebar trafik ke semua pod siap lewat mekanisme kube-proxy dan iptables — pod ganti IP seenaknya, tetapi alamat <code>catalog.oms.svc:80</code> tetap sama.',
        'Ingress memilih backend berdasarkan <b>nama host</b>: satu IP eksternal melayani banyak service (order.dev.example.com ke order, catalog.dev.example.com ke catalog), sementara dari dalam cluster order-service cukup memanggil <code>http://catalog.oms.svc:80/products/1</code> — tanpa melewati Ingress, tanpa biaya TLS tambahan.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Resource Requests, Limits, dan Autoscaling</h3><p>Tanpa batas resource, satu service bocor memori bisa menghabiskan seluruh node dan membunuh pod service lain — ini penyebab klasik gangguan yang tampak "tidak jelas asalnya". Dengan <code>requests</code>, penjadwal memilih node yang benar-benar punya sisa kapasitas; dengan <code>limits</code>, CPU yang rakus dibatasi lewat throttling dan memori yang berlebih dihentikan sebelum merusak node. Angka awal yang wajar: requests sedikit di bawah konsumsi rata-rata, limits dua sampai empat kali requests — lalu perbaiki berdasarkan metrik nyata dari Prometheus, bukan tebakan.</p><p>Begitu angka itu ada, <b>Horizontal Pod Autoscaler (HPA)</b> bisa bekerja: ia memantau penggunaan CPU (atau custom metric seperti antrean panjang) lalu menambah atau mengurangi jumlah pod agar mendekati target. HPA berjalan di atas Deployment yang sudah benar — tanpa requests, HPA tidak punya dasar pengukuran.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Horizontal Pod Autoscaler untuk catalog',
      lang: 'yaml',
      output: false,
      code: `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: catalog
  namespace: oms
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: catalog
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70   # jaga CPU ~70% dari requests`,
      explain: [
        '<code>averageUtilization: 70</code> dihitung terhadap <b>requests</b>, bukan limits — inilah alasan angka requests harus masuk akal.',
        '<code>minReplicas: 2</code> menjaga ketersediaan minimal; dengan dua pod, perawatan node tidak pernah menyisakan nol pod catalog.',
        'Scaling keluar butuh waktu (menarik image, start, ready) — untuk lonjakan sangat tajam, gabungkan dengan scheduled scaling menjelang jam sibuk.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh: Perintah kubectl harian',
      lang: 'bash',
      output: false,
      code: `# Terapkan seluruh manifest folder (deklaratif: yaml adalah sumber kebenaran)
kubectl apply -f deploy/k8s/

# Kondisi saat ini
kubectl -n oms get deploy,po,svc -o wide
kubectl -n oms describe deploy catalog     # event dan kondisi terperinci

# Pantau rollout: berhenti otomatis saat semua pod baru ready
kubectl -n oms rollout status deploy/catalog --timeout=180s

# Skalakan manual sementara (akan dikoreksi HPA bila ada)
kubectl -n oms scale deploy/catalog --replicas=4

# Log dan debugging
kubectl -n oms logs deploy/catalog --tail=100 -f
kubectl -n oms logs po/catalog-7d9f-abc12 --previous   # container yang baru crash
kubectl -n oms exec -it po/catalog-7d9f-abc12 -- sh

# Rilis image baru, lalu rollback bila ternyata rusak
kubectl -n oms set image deploy/catalog catalog=ghcr.io/example/oms-catalog:9b41ee0
kubectl -n oms rollout status deploy/catalog
kubectl -n oms rollout history deploy/catalog
kubectl -n oms rollout undo deploy/catalog              # kembali ke revisi sebelumnya`,
      explain: [
        'Manifest folder diperlakukan sebagai satu kesatuan: <code>apply</code> membandingkan keinginan di YAML dengan kenyataan lalu mengubah hanya bagian yang berbeda.',
        '<code>describe</code> menampilkan event terakhir — tempat pertama melihat ImagePullBackOff, OOMKilled, atau probe yang gagal.',
        '<code>logs --previous</code> menyelamatkanmu ketika container crash-loop: log dari kehidupan sebelumnya masih bisa dibaca.',
        'Rollback lewat <code>rollout undo</code> tidak menyentuh database — itulah mengapa migration tetap harus memakai pola expand–contract dari bab CI/CD.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Helm, Kustomize, RBAC, dan Network Policy</h3><p>Manifest YAML cepat berlipat ganda: antar service hanya berbeda nama, image, dan port. <b>Kustomize</b> (bawaan <code>kubectl</code>) menyatukannya dengan <i>base</i> bersama lalu <i>overlay</i> per lingkungan — dev pakai image tag commit, produksi pakai tag rilis, tanpa menduplikasi file. <b>Helm</b> menaikkan level serupa dengan <i>chart</i>: template berparameter plus <code>values.yaml</code>, lengkap dengan <code>helm upgrade --install</code> dan <code>helm rollback</code>. Pilih Kustomize bila kamu suka YAML polos; pilih Helm bila tim membutuhkan variabel dan siklus rilis yang seragam.</p><p>Dua rem keamanan yang wajib dikenal. <b>RBAC</b> (Role-Based Access Control) menentukan <i>apa yang boleh dilakukan akun di dalam cluster</i> — pod notification-service seharusnya tidak pernah bisa menghapus namespace. <b>Network policy</b> membatasi <i>siapa boleh bicara ke siapa</i> di level jaringan: dalam OMS, hanya order-service yang diizinkan mencapai port 8081 catalog-service, dan tidak ada pod yang boleh bicara langsung ke PostgreSQL milik layanan lain. Tanpa network policy, satu pod yang berhasil dikuasai penyerang bebas menjelajah seluruh cluster.</p>'
    },
    {
      type: 'tip',
      title: 'Latihan: Cluster Lokal, Rolling Update, dan Rollback',
      text: '<p>Buat cluster lokal dengan <code>minikube start</code> atau <code>kind create cluster</code>, lalu deploy catalog-service lengkap dengan ConfigMap, Secret, dan kedua probe. Uji tiga hal: (1) jalankan <code>kubectl rollout status</code> sambil memantau <code>kubectl get po -w</code> dan pastikan tersedia dua pod sehat; (2) ganti image ke versi yang sengaja dibuat gagal start (misal perintah entrypoint salah) dan amati pod CrashLoopBackOff tanpa cluster kehilangan semua pod sekaligus; (3) jalankan <code>rollout undo</code> dan pastikan layanan pulih dalam hitungan detik. Terakhir, matikan satu node bila clustermu punya lebih dari satu, dan amati pod otomatis dipindahkan ke node sehat.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Cluster', 'Kumpulan node yang dikelola bersama oleh Kubernetes; minimal satu control plane dan satu worker.'],
        ['Node', 'Satu mesin (VM atau bare metal) di dalam cluster tempat pod dijadwalkan.'],
        ['Pod', 'Unit terkecil yang berisi satu container dan selalu dijadwalkan bersama; bersifat sekali pakai.'],
        ['Deployment', 'Objek yang mempertahankan sejumlah replika pod dan mengurus rolling update serta rollback.'],
        ['Service (ClusterIP)', 'Alamat virtual stabil yang menyebar trafik ke pod siap berdasarkan label.'],
        ['ConfigMap & Secret', 'Objek penyimpan konfigurasi; Secret untuk nilai sensitif yang dienkripsi bila storage mendukung.'],
        ['Readiness probe', 'Pemeriksaan kesiapan menerima trafik; gagal berarti pod dikeluarkan sementara dari Service.'],
        ['Liveness probe', 'Pemeriksaan kesehatan proses; gagal berarti container di-restart.'],
        ['Rolling update', 'Strategi penggantian pod satu per satu sehingga layanan tidak pernah nol replika.'],
        ['HPA', 'Horizontal Pod Autoscaler: menyesuaikan jumlah pod berdasarkan metrik seperti utilisasi CPU.'],
        ['Ingress', 'Titik masuk eksternal yang mengarahkan trafik ke Service berdasarkan host atau path.'],
        ['RBAC & Network policy', 'Mekanisme pembatas izin akses API cluster dan pembatas lalu lintas jaringan antarpod.']
      ]
    }
  ],
  recap: [
    'Cluster berisi node; node menjalankan pod; pod sekali pakai dan diganti, bukan dihidupkan kembali.',
    'Deployment mempertahankan dua replika catalog-service dengan RollingUpdate maxSurge 1 dan maxUnavailable 0 sehingga deploy tanpa downtime.',
    'Readiness (/readyz) mengeluarkan pod dari Service tanpa membunuhnya; liveness (/healthz) me-restart container — jangan disatukan.',
    'requests menentukan penjadwalan, limits membatasi pemakaian; keduanya menjadi dasar kerja HPA.',
    'Service ClusterIP memberi alamat stabil di dalam cluster, Ingress mengarahkan trafik eksternal berdasarkan host.',
    'kubectl apply, rollout status, logs --previous, dan rollout undo adalah perintah harian yang wajib hafal; Helm dan Kustomize mengelola duplikasi manifest, sedangkan RBAC dan network policy membatasi blast radius.'
  ]
});
