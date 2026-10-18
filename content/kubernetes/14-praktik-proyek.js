/* ============================================================
   Pelajaran Kubernetes — Bab 14: Praktik Proyek Dari Podman ke Cluster Kubernetes
   ============================================================ */
'use strict';

window.KUBERNETES_LESSONS = window.KUBERNETES_LESSONS || [];

window.KUBERNETES_LESSONS.push({
  id: 'praktik-proyek',
  title: 'Praktik Proyek: Dari Podman ke Cluster Kubernetes',
  chapter: 'Praktik',
  duration: '12–15 menit',
  intro: [
    'Selama ini kamu mungkin merasa nyaman menjalankan container dengan Podman di komputer sendiri. Namun ketika aplikasi harus terus berjalan, memiliki lebih dari satu salinan, dan mudah dipindahkan antarlingkungan, mengelola container satu per satu di terminal mulai terasa rapuh dan melelahkan.',
    'Kabar baiknya, jembatan menuju Kubernetes sudah tersedia di Podman: <code>podman generate kube</code> mengekspor container yang sedang berjalan menjadi manifest Kubernetes, dan <code>podman play kube</code> menjalankan manifest Kubernetes langsung di Podman. Bab ini mengikuti alur itu dari nol: aplikasi lokal di Podman, manifest, cluster Minikube dengan driver Podman, hingga Deployment dan Service layak produksi.',
    'Kamu akan menyelesaikan satu proyek utuh — bab praktik terpanjang di tutorial ini — dari memverifikasi aplikasi lokal sampai memantaunya secara visual dengan k9s, ditutup dengan pembersihan resource dan checklist menuju produksi.'
  ],
  objectives: [
    'Menjalankan dan memverifikasi aplikasi web secara lokal dengan Podman',
    'Mengekspor container Podman menjadi manifest Kubernetes lalu membaca isinya',
    'Membuat cluster Minikube dengan driver Podman dan menerapkan manifest',
    'Mengonversi Pod menjadi Deployment serta Service layak produksi dan memantaunya'
  ],
  sections: [
    {
      type: 'text',
      html: `<h3>Alur Lengkap Proyek Ini</h3><p>Proyek ini mengikuti urutan yang lazim dipakai tim nyata: mulai dari container lokal, dijadikan deklaratif, diterapkan ke cluster, lalu ditingkatkan menjadi objek produksi. Setiap langkah memakai perintah yang bisa langsung kamu salin.</p>
      <figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Alur proyek: Podman lokal, podman generate kube, cluster Minikube atau Kind, kubectl apply, lalu objek Deployment Service dan Pod">
        <rect x="10" y="100" width="150" height="90" rx="10" class="u-box"/><text x="85" y="128" class="u-title">Podman (Lokal)</text>
        <text x="85" y="152" class="u-lbl" text-anchor="middle">podman run -d</text>
        <text x="85" y="172" class="u-lbl" text-anchor="middle">container berjalan</text>
        <rect x="190" y="100" width="140" height="90" rx="10" class="u-hd"/><text x="260" y="128" class="u-title">web.yaml</text>
        <text x="260" y="152" class="u-lbl" text-anchor="middle">manifest Pod</text>
        <text x="260" y="172" class="u-lbl" text-anchor="middle">deklaratif</text>
        <rect x="360" y="80" width="160" height="130" rx="10" class="u-box"/><text x="440" y="110" class="u-title">Minikube / Kind</text>
        <text x="440" y="136" class="u-lbl" text-anchor="middle">cluster lokal</text>
        <text x="440" y="156" class="u-lbl" text-anchor="middle">driver podman</text>
        <text x="440" y="176" class="u-lbl" text-anchor="middle">kubectl get nodes</text>
        <rect x="550" y="50" width="200" height="200" rx="10" class="u-box"/><text x="650" y="80" class="u-title">Objek Kubernetes</text>
        <rect x="566" y="100" width="80" height="34" rx="6" class="u-hd"/><text x="606" y="122" class="u-lbl" text-anchor="middle">Deployment</text>
        <rect x="654" y="100" width="80" height="34" rx="6" class="u-hd"/><text x="694" y="122" class="u-lbl" text-anchor="middle">Service</text>
        <rect x="566" y="146" width="80" height="34" rx="6" class="u-hd"/><text x="606" y="168" class="u-lbl" text-anchor="middle">Pod x 2</text>
        <text x="650" y="206" class="u-lbl" text-anchor="middle">label, probe, requests / limits</text>
        <line x1="160" y1="145" x2="186" y2="145" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="173" y="132" class="u-lbl" text-anchor="middle">generate</text>
        <line x1="330" y1="145" x2="356" y2="145" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="343" y="132" class="u-lbl" text-anchor="middle">apply</text>
        <line x1="520" y1="145" x2="546" y2="145" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="533" y="132" class="u-lbl" text-anchor="middle">object</text>
        <text x="380" y="282" class="u-sub" text-anchor="middle">Konfigurasi lokal yang sama menjadi deklarasi cluster — tanpa menulis ulang dari nol</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 14.1</b> — Alur end-to-end: Podman lokal lalu manifest lalu cluster lalu objek Kubernetes</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Langkah 1 & 2: Aplikasi Lokal di Podman dan Ekspor Manifest',
      lang: 'bash',
      output: false,
      code: `# ===== Langkah 1: jalankan aplikasi web di Podman =====
podman run -d --name web -p 8080:80 nginx:alpine

# Verifikasi dari host
curl -I localhost:8080

# Periksa status dan log
podman ps
podman logs web

# ===== Langkah 2: ekspor deklaratif ke Kubernetes =====
# Ubah container yang sedang berjalan menjadi manifest
podman generate kube web -f web.yaml

# Baca isi hasil generate
cat web.yaml

# (Opsional) jalankan manifest itu langsung di Podman — hapus dulu container lama
podman rm -f web
podman play kube web.yaml`,
      explain: [
        'Hasil generate berupa objek <b>Pod</b>: <code>apiVersion: v1</code>, <code>kind: Pod</code>, blok <code>metadata</code>, lalu <code>spec.containers</code> berisi image, port, dan command yang kamu jalankan tadi.',
        'Perhatikan juga <code>restartPolicy: Always</code> — kebijakan ini hanya berlaku pada Pod, bukan pada Deployment yang justru selalu memakai Always.',
        'Manifest mentah seperti ini belum layak produksi: tidak ada label untuk dipilih Service, tidak ada resource requests/limits, dan tidak ada probe kesehatan.',
        '<code>podman play kube</code> membalik arah alur: file manifest Kubernetes dijalankan kembali sebagai pod Podman, berguna untuk menguji file tanpa cluster.'
      ]
    },
    {
      type: 'example',
      title: 'Langkah 3: Cluster Minikube dengan Driver Podman',
      lang: 'bash',
      output: false,
      code: `# 1) Buat cluster lokal — node-nya berjalan sebagai pod Podman (rootless)
minikube start --driver=podman

# 2) Pastikan node sudah siap dan berstatus Ready
kubectl get nodes -o wide

# 3) Terapkan manifest hasil generate tadi
kubectl apply -f web.yaml

# 4) Amati pod yang tercipta beserta node dan IP-nya
kubectl get pods -o wide
kubectl describe pod web`,
      explain: [
        'Dengan <code>--driver=podman</code>, Minikube menjalankan node cluster sebagai container Podman milikmu sendiri, sehingga tetap rootless dan tidak butuh daemon terpisah.',
        'Perintah <code>kubectl apply -f</code> bersifat deklaratif: kamu menyatakan keadaan yang diinginkan, lalu cluster mewujudkannya.',
        'Jika pod berstatus ContainerCreating terlalu lama, periksa hasil <code>kubectl describe pod web</code> — bagian Events di bawahnya hampir selalu menunjukkan penyebabnya.'
      ]
    },
    {
      type: 'example',
      title: 'Langkah 4: Manifest Deployment dan Service Layak Produksi',
      lang: 'yaml',
      output: false,
      code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  labels:
    app: web
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
        - name: web
          image: nginx:1.27-alpine
          ports:
            - containerPort: 80
          resources:
            requests: { cpu: 50m, memory: 64Mi }
            limits: { cpu: 200m, memory: 128Mi }
          livenessProbe:
            httpGet: { path: /, port: 80 }
            initialDelaySeconds: 5
            periodSeconds: 10
          readinessProbe:
            httpGet: { path: /, port: 80 }
            initialDelaySeconds: 2
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  type: ClusterIP
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 80`,
      explain: [
        'Uraian <code>spec.selector.matchLabels</code> pada Deployment harus cocok dengan <code>labels</code> pada pod template, dan label <code>app: web</code> yang sama dipakai Service untuk menemukan pod tujuan.',
        'Image memakai tag versi spesifik (<code>1.27-alpine</code>) alih-alih <code>latest</code>, sehingga rollout selalu memakai kode yang sudah kamu uji.',
        '<code>requests</code> menjamin alokasi minimum dan <code>limits</code> membatasi pemakaian maksimal; keduanya menjadi dasar scheduler dan kelas QoS pod.',
        'Liveness probe memicu restart bila aplikasi hang, sedangkan readiness probe menahan trafik sampai pod benar-benar siap melayani.'
      ]
    },
    {
      type: 'example',
      title: 'Langkah 4 & 5: Menerapkan, Menguji, dan Memantau',
      lang: 'bash',
      output: false,
      code: `# 1) Terapkan manifest produksi
kubectl apply -f web-deployment.yaml

# 2) Pantau rollout sampai selesai
kubectl rollout status deployment/web

# 3) Service web sudah ada di manifest, jadi cukup ubah tipenya menjadi NodePort
kubectl patch svc web -p '{"spec":{"type":"NodePort"}}'
#    (alternatif bila Service tidak dibuat di manifest: kubectl expose deployment web --type=NodePort --port=80 --name=web)

# 4) Lihat seluruh objek yang tercipta
kubectl get all -o wide

# 5) Uji dari komputermu (port 8080 lokal diteruskan ke port 80 service)
kubectl port-forward svc/web 8080:80

# 6) Lihat log tanpa masuk ke container
kubectl logs -f deployment/web

# 7) Monitor visual dari terminal (keluar dengan q, mode perintah dengan :)
k9s`,
      explain: [
        'Rollout berarti pod lama diganti bertahap oleh pod baru; perintah <code>rollout status</code> menunggu sampai penggantian benar-benar selesai.',
        '<code>kubectl get all -o wide</code> menampilkan Deployment, ReplicaSet, Pod, dan Service sekaligus beserta IP serta node masing-masing.',
        'Setelah selesai belajar, jalankan <code>kubectl delete -f web-deployment.yaml</code> lalu kembalikan tipe Service bila tidak dipakai lagi.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Penutup: Pembersihan dan Checklist Menuju Produksi</h3><p>Setelah praktik selesai, bersihkan resource agar komputermu tidak menumpuk sisa cluster dan container:</p><pre><code>kubectl delete -f web-deployment.yaml\nminikube delete\npodman rm -f web\npodman pod rm web</code></pre><p>Proyek ini masih jauh dari produksi sungguhan. Sebelum membawa pola yang sama ke server, centang checklist berikut:</p><ul><li><b>Tag image spesifik</b> — jangan pernah memakai <code>latest</code> di lingkungan produksi.</li><li><b>Resource requests dan limits</b> — wajib ada agar pemakaian dapat diramalkan.</li><li><b>Probe kesehatan</b> — liveness, readiness, dan bila perlu startup probe.</li><li><b>Secret terpisah</b> — kredensial tidak boleh ditanam di ConfigMap atau manifest.</li><li><b>Autoscaling</b> — siapkan HPA ketika trafik benar-benar bervariasi.</li><li><b>Backup PVC</b> — data persisten wajib punya rencana backup dan pemulihan.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Ulangi Proyek yang Sama di Kind',
      text: 'Setelah percaya diri dengan Minikube driver Podman, ulangi proyek ini di Kind (<code>kind create cluster</code>) untuk merasakan perbedaannya: Kind menjalankan node cluster sebagai container, sehingga manifest yang sama persis bisa langsung diterapkan. Perpindahan ini bukti nyata bahwa konfigurasi deklaratifmu benar-benar portabel.'
    },
    {
      type: 'warn',
      title: 'Hasil generate Bukan Manifest Produksi',
      text: 'File dari <code>podman generate kube</code> hanyalah potret keadaan container sesaat: tanpa label, tanpa resource budget, tanpa probe, dan terkunci pada pola Pod yang tidak bisa di-rollout. Selalu anggap hasil generate sebagai titik awal yang kamu tingkatkan menjadi Deployment dan Service, seperti pada Langkah 4.'
    },
    {
      type: 'vocab',
      items: [
        ['Manifest', 'File YAML yang mendeklarasikan objek Kubernetes dan diterapkan lewat kubectl apply.'],
        ['Deployment', 'Controller pengelola ReplicaSet dan pod untuk aplikasi stateless, lengkap dengan rolling update dan rollback.'],
        ['Service', 'Objek yang menyediakan IP virtual dan load balancing menuju pod terpilih berdasarkan label.'],
        ['NodePort', 'Tipe Service yang membuka port tertentu di setiap node agar aksesibel dari luar cluster.'],
        ['port-forward', 'Meneruskan port lokal ke service atau pod di cluster untuk pengujian sementara.'],
        ['rollout', 'Proses penggantian pod secara bertahap oleh Deployment beserta cara memantaunya.']
      ]
    }
  ],
  recap: [
    'Podman menyediakan jembatan langsung ke Kubernetes: <code>podman generate kube</code> untuk mengekspor dan <code>podman play kube</code> untuk menjalankan manifest secara lokal.',
    'Minikube dengan <code>--driver=podman</code> menjalankan node cluster sebagai container rootless yang familiar di workflow Podman-mu.',
    'Manifest hasil generate adalah titik awal; menuju produksi, konversi menjadi Deployment dengan 2 replica, label, requests/limits, probe, serta Service ClusterIP.',
    'Pantau rollout dengan <code>kubectl rollout status</code>, uji lewat <code>kubectl port-forward</code>, dan amati secara visual dengan k9s.'
  ]
});
