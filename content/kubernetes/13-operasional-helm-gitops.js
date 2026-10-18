/* ============================================================
   Pelajaran Kubernetes — Bab 13: Helm, GitOps, Observability & Service Mesh
   ============================================================ */
'use strict';

window.KUBERNETES_LESSONS = window.KUBERNETES_LESSONS || [];

window.KUBERNETES_LESSONS.push({
  id: 'operasional-ekosistem',
  title: 'Helm, GitOps, Observability & Service Mesh',
  chapter: 'Operasional',
  duration: '10–12 menit',
  intro: [
    'Cluster Kubernetes sudah berjalan dan aplikasi berhasil dideploy. Namun ketika jumlah aplikasi, tim, dan lingkungan bertambah, masalah baru muncul: ratusan file manifest yang disalin-tempel, perbedaan konfigurasi antar-staging dan produksi yang tidak terkontrol, dan proses update yang mengandalkan ketikan manual di terminal.',
    'Untuk skala inilah ekosistem pendukung Kubernetes tumbuh. <b>Helm</b> menyederhanakan pemasangan aplikasi layaknya "apt-get untuk Kubernetes", <b>GitOps</b> menjadikan Git sebagai satu-satunya sumber kebenaran untuk deployment, <b>observability</b> memberi visibilitas terhadap apa yang terjadi di dalam cluster, dan <b>service mesh</b> mengelola komunikasi antarlayanan.',
    'Bab ini membahas perawatan node, manajemen paket dengan Helm, tumpukan observability (metrik, logging, tracing), pengantar service mesh, serta alur GitOps beserta ArgoCD dan FluxCD — semuanya dengan perintah yang bisa langsung dicoba di Minikube driver Podman maupun Kind.'
  ],
  objectives: [
    'Melakukan maintenance node dengan aman memakai cordon, drain, dan uncordon',
    'Memasang, memperbarui, dan melakukan rollback aplikasi menggunakan Helm',
    'Mengenali tumpukan observability serta peran service mesh dalam cluster',
    'Memahami prinsip GitOps beserta peran ArgoCD dan FluxCD sebagai reconciler'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Perawatan Node</h3><p>Node (baik mesin fisik, VM, maupun cluster lokal seperti Minikube) sewaktu-waktu perlu <b>maintenance</b>: update kernel, patch keamanan, atau penambahan memori. Pod yang sedang berjalan di node tersebut tidak boleh dipaksa mati begitu saja. Kubernetes menyediakan tiga perintah untuk ini:</p><ul><li><code>kubectl cordon node-1</code> — menandai node <b>tidak menerima pod baru</b>; pod lama tetap berjalan.</li><li><code>kubectl drain node-1 --ignore-daemonsets --delete-emptydir-data</code> — mengosongkan node dengan mengusir (evict) pod agar dipindah ke node lain; pod DaemonSet dilewati dan isi emptyDir dihapus.</li><li><code>kubectl uncordon node-1</code> — mengembalikan node menjadi siap menerima pod setelah maintenance selesai.</li></ul>'
    },
    {
      type: 'example',
      title: 'Maintenance Node dari Awal sampai Selesai',
      lang: 'bash',
      output: false,
      code: `# 1) Tandai node tidak menerima pod baru
kubectl cordon node-1

# 2) Kosongkan node (pod dipindah ke node lain)
kubectl drain node-1 --ignore-daemonsets --delete-emptydir-data

# ... jalankan maintenance host di terminal lain (update, patch, reboot) ...

# 3) Setelah siap, kembalikan node ke dalam layanan
kubectl uncordon node-1

# 4) Pastikan semua pod kembali sehat
kubectl get pods -A -o wide`,
      explain: [
        'Perintah drain memicu eviction, bukan penghapusan paksa, sehingga controller seperti Deployment segera membuat pengganti pod di node lain.',
        'Flag <code>--ignore-daemonsets</code> diperlukan karena pod DaemonSet (misalnya agen logging atau monitor) memang wajib ada di setiap node dan tidak bisa dipindah.',
        'Flag <code>--delete-emptydir-data</code> harus dipahami sebagai peringatan: data di emptyDir akan hilang ketika pod dipindahkan.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Helm: "apt-get untuk Kubernetes"</h3><p>Menjalankan satu aplikasi di Kubernetes bisa berarti menulis banyak manifest: Deployment, Service, ConfigMap, Ingress, dan lainnya. <b>Helm</b> adalah package manager yang mengemas manifest-manifest tersebut menjadi satu paket bernama <b>chart</b>.</p><p>Konsep penting Helm: <b>chart</b> (template manifest), <b>values.yaml</b> (file parameter yang mengisi variabel di chart), <b>release</b> (satu instalasi chart dengan nama tertentu), dan <b>repository</b> (tempat berbagi chart, peranannya mirip Docker Hub untuk image). Satu chart dapat dipasang berkali-kali dengan nama dan konfigurasi berbeda.</p>'
    },
    {
      type: 'example',
      title: 'Workflow Helm dari Nol',
      lang: 'bash',
      output: false,
      code: `# 1) Tambahkan repository resmi Bitnami
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# 2) Cari chart yang tersedia
helm search repo bitnami/nginx

# 3) Lihat parameter bawaan chart
helm show values bitnami/nginx

# 4) Pasang dengan konfigurasi sendiri
helm install my-app bitnami/nginx -f values.yaml

# 5) Periksa release yang sedang berjalan
helm list

# 6) Perbarui konfigurasi (idempoten, aman diulang)
helm upgrade --install my-app bitnami/nginx -f values.yaml

# 7) Lihat manifest hasil render tanpa menyentuh cluster
helm template my-app bitnami/nginx -f values.yaml

# 8) Kembali ke revisi sebelumnya bila ada masalah
helm rollback my-app 1`,
      explain: [
        'Perintah <code>upgrade --install</code> bersifat idempoten: release dipasang bila belum ada dan diperbarui bila sudah ada, sehingga aman dijadikan bagian skrip deployment.',
        '<code>helm template</code> merender chart menjadi manifest YAML murni; hasilnya bisa dibandingkan atau dimasukkan ke Git untuk direview sebelum diterapkan.',
        '<code>helm rollback</code> mengembalikan release ke revisi tertentu yang tercatat otomatis oleh Helm, sehingga pembaruan yang gagal bisa dipulihkan sekejap.'
      ]
    },
    {
      type: 'text',
      html: `<h3>Observability: Melihat Isi Kepala Cluster</h3><p>Container yang berjalan bukan berarti sehat. Tumpukan observability dibagi tiga: <b>metrik</b> untuk tren dan peringatan, <b>logging</b> untuk detail peristiwa, dan <b>tracing</b> untuk melacak perjalanan satu request lintas layanan.</p><ul><li><b>Metrik:</b> <code>metrics-server</code> menyediakan pemakaian CPU/memori saat ini untuk <code>kubectl top</code> dan HPA, sedangkan <b>Prometheus</b> (sering dipasang lewat kube-prometheus-stack / Prometheus Operator) menyimpan metrik cluster-wide dan <b>Grafana</b> memvisualisasikannya.</li><li><b>Logging:</b> stack <b>PLG</b> (Promtail lalu Loki lalu Grafana) atau stack <b>EFK</b> (Fluentd lalu Elasticsearch lalu Kibana) mengumpulkan log dari semua pod ke satu tempat pencarian.</li><li><b>Tracing:</b> <b>OpenTelemetry</b> menjadi standar instrumen modern dan hasilnya divisualisasikan di <b>Jaeger</b> atau backend lain.</li></ul><h3>Service Mesh: Jaringan Layanan yang Terkelola</h3><p>Begitu ada belasan layanan yang saling memanggil, logika jaringan seperti retry, timeout, dan enkripsi sebaiknya tidak ditanam di dalam kode aplikasi. <b>Istio</b> dan <b>Linkerd</b> menambahkan <b>sidecar proxy</b> di samping tiap pod sehingga seluruh trafik melewatinya. Manfaatnya: mTLS otomatis antarlayanan, manajemen trafik untuk strategi canary dan blue-green, retry/timeout yang konsisten, serta observability trafik tanpa mengubah kode aplikasi.</p><h3>GitOps: Git sebagai Sumber Kebenaran Tunggal</h3><p><b>GitOps</b> adalah metodologi deployment deklaratif: keadaan cluster yang diinginkan (desired state) seluruhnya ditulis dalam Git, lalu sebuah <b>reconcile loop</b> terus membandingkan keadaan cluster dengan isi Git dan menyelaraskannya. Bila seseorang mengubah manifest langsung di cluster (keadaan drift), agent GitOps mengembalikannya sesuai isi Git. <b>ArgoCD</b> dan <b>FluxCD</b> adalah penerapannya yang paling umum.</p>
      <figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Alur GitOps: Git repository disinkronkan ArgoCD atau Flux ke cluster Kubernetes dengan reconcile loop">
        <rect x="20" y="90" width="200" height="110" rx="10" class="u-box"/>
        <text x="120" y="120" class="u-title">Git Repository</text>
        <text x="120" y="146" class="u-lbl" text-anchor="middle">manifest + values.yaml</text>
        <text x="120" y="166" class="u-lbl" text-anchor="middle">review, versi, riwayat</text>
        <text x="120" y="186" class="u-lbl" text-anchor="middle">single source of truth</text>
        <rect x="280" y="90" width="200" height="110" rx="10" class="u-hd"/>
        <text x="380" y="120" class="u-title">ArgoCD / FluxCD</text>
        <text x="380" y="146" class="u-lbl" text-anchor="middle">reconcile loop</text>
        <text x="380" y="166" class="u-lbl" text-anchor="middle">diff &amp; sync otomatis</text>
        <text x="380" y="186" class="u-lbl" text-anchor="middle">deteksi drift</text>
        <rect x="540" y="70" width="200" height="150" rx="10" class="u-box"/>
        <text x="640" y="98" class="u-title">Kubernetes Cluster</text>
        <rect x="556" y="112" width="80" height="30" rx="6" class="u-hd"/>
        <text x="596" y="132" class="u-lbl" text-anchor="middle">Pod</text>
        <rect x="644" y="112" width="80" height="30" rx="6" class="u-hd"/>
        <text x="684" y="132" class="u-lbl" text-anchor="middle">Service</text>
        <rect x="556" y="152" width="80" height="30" rx="6" class="u-hd"/>
        <text x="596" y="172" class="u-lbl" text-anchor="middle">Ingress</text>
        <rect x="644" y="152" width="80" height="30" rx="6" class="u-hd"/>
        <text x="684" y="172" class="u-lbl" text-anchor="middle">ConfigMap</text>
        <text x="640" y="204" class="u-lbl" text-anchor="middle">keadaan aktual</text>
        <line x1="220" y1="145" x2="276" y2="145" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="248" y="135" class="u-lbl" text-anchor="middle">pull</text>
        <line x1="480" y1="145" x2="536" y2="145" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="508" y="135" class="u-lbl" text-anchor="middle">apply</text>
        <line x1="540" y1="245" x2="420" y2="245" class="u-dash" marker-end="url(#u-arrow)"/>
        <text x="480" y="235" class="u-lbl" text-anchor="middle">observasi keadaan cluster</text>
        <text x="380" y="282" class="u-sub" text-anchor="middle">Drift: perubahan langsung di cluster dikembalikan sesuai isi Git</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 13.1</b> — Alur GitOps: Git sebagai sumber kebenaran, ArgoCD/Flux menyelaraskan cluster</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'ArgoCD: Install, Buat Aplikasi, dan Sinkronisasi',
      lang: 'bash',
      output: false,
      code: `# 1) Pasang ArgoCD di cluster
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 2) Ambil password awal & buka akses UI di lokal
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d; echo
kubectl -n argocd port-forward svc/argocd-server 8081:443

# 3) Login CLI (user awal: admin)
argocd login localhost:8081 --username admin --password <password>

# 4) Buat aplikasi dari repository Git
argocd app create web-app \\
  --repo https://github.com/username/repo-k8s.git \\
  --path deploy/minikube \\
  --dest-server https://kubernetes.default.svc \\
  --dest-namespace default

# 5) Sinkronkan dan tunggu sampai sehat
argocd app sync web-app
argocd app wait web-app --health`,
      explain: [
        'ArgoCD bekerja sebagai reconciler: ia memantau isi repository Git dan kondisi cluster, lalu menampilkan perbedaannya di UI sebelum melakukan sinkronisasi.',
        'Perintah <code>sync</code> menerapkan manifest dari Git ke cluster; bila ada perubahan langsung di cluster, ArgoCD menandainya sebagai drift.',
        'Alternatifnya, FluxCD dipasang lewat <code>flux bootstrap git</code> dan bekerja sepenuhnya otomatis tanpa UI, sehingga cocok untuk alur push ke Git.'
      ]
    },
    {
      type: 'tip',
      title: 'Mulai dari Helm, Naik ke GitOps Saat Sudah Matang',
      text: 'Saat baru memulai, cukup kuasai Helm untuk mengemas dan memperbarui aplikasi — manfaatnya sudah terasa tanpa infrastruktur tambahan. Terapkan GitOps ketika tim sudah mulai besar dan ada banyak lingkungan (dev, staging, produksi), karena saat itulah Git sebagai sumber kebenaran tunggal benar-benar mencegah konfigurasi menyebar di banyak tempat.'
    },
    {
      type: 'warn',
      title: 'Perhatian Saat Maintenance dan Sinkronisasi',
      text: '<code>kubectl drain</code> mengusir pod dan menghapus data di emptyDir, jadi pastikan aplikasimu memang stateless atau datanya sudah berbasis PersistentVolumeClaim sebelum menjalankannya. Di sisi GitOps, jangan pernah mengubah manifest secara langsung di cluster produksi: perubahan seperti itu dianggap drift dan akan tertimpa otomatis oleh ArgoCD atau FluxCD — ubahlah lewat commit ke Git.'
    },
    {
      type: 'vocab',
      items: [
        ['Chart', 'Paket berisi template manifest Kubernetes yang dipasang dan dikelola oleh Helm.'],
        ['Release', 'Satu instalasi chart dengan nama dan konfigurasi values.yaml tertentu.'],
        ['GitOps', 'Metodologi deployment yang menjadikan Git sebagai sumber kebenaran tunggal untuk keadaan cluster.'],
        ['Reconcile loop', 'Siklus perbandingan terus-menerus antara keadaan cluster dan keadaan yang diinginkan di Git.'],
        ['Sidecar proxy', 'Proxy tambahan yang berjalan di samping aplikasi dalam pod untuk mengelola trafik, seperti Istio atau Linkerd.'],
        ['mTLS', 'Enkripsi dan autentikasi dua arah otomatis antarlayanan di dalam cluster.'],
        ['Observability', 'Kemampuan memahami keadaan sistem lewat metrik, log, dan tracing.']
      ]
    }
  ],
  recap: [
    'Perawatan node yang aman berurutan: cordon, lalu drain (dengan <code>--ignore-daemonsets --delete-emptydir-data</code>), maintenance, dan uncordon.',
    'Helm mengemas manifest menjadi chart; values.yaml mengisi variabel, sedangkan <code>helm upgrade --install</code> dan <code>helm rollback</code> membuat pembaruan aman dan mudah dibatalkan.',
    'Observability mencakup metrik (Prometheus/Grafana), logging (PLG/EFK), dan tracing (OpenTelemetry/Jaeger); service mesh seperti Istio dan Linkerd menambah mTLS, manajemen trafik, dan observability antarlayanan.',
    'GitOps menempatkan Git sebagai sumber kebenaran tunggal; ArgoCD atau FluxCD terus menyelaraskan cluster dengan isi Git melalui reconcile loop.'
  ]
});
