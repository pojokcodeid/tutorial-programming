/* ============================================================
   Pelajaran Kubernetes — Bab 2: Instalasi & Cluster Lokal dengan Podman
   ============================================================ */
'use strict';

window.KUBERNETES_LESSONS = window.KUBERNETES_LESSONS || [];

window.KUBERNETES_LESSONS.push({
  id: 'setup-cluster-lokal',
  title: 'Instalasi & Cluster Lokal dengan Podman',
  chapter: 'Pengenalan',
  duration: '8–10 menit',
  intro: [
    'Banyak tutorial Kubernetes langsung menyuruh <code>kubectl apply</code> tanpa menjelaskan dari mana cluster itu berasal. Akibatnya, satu perintah gagal dan pesannya kabur: image tidak ditemukan, driver tidak cocok, atau node tidak pernah siap.',
    'Di materi ini semua dijalankan <b>rootless dengan Podman</b> sebagai engine container. Kamu akan menyiapkan prasyarat Podman, memasang <code>kubectl</code> sebagai jendela ke cluster, lalu memilih satu dari beberapa penyedia cluster lokal: <b>Minikube dengan driver Podman</b>, <b>Kind</b>, atau alternatif ringan seperti K3s dan MicroK8s.',
    'Bab ini juga membahas cara membawa image lokal ke dalam cluster, mengelola konteks dan namespace dengan <code>kubectx</code>/<code>kubens</code>, serta memantau resource lewat TUI <code>k9s</code>.'
  ],
  objectives: [
    'Memeriksa kesiapan Podman rootless, cgroups v2, dan subuid',
    'Memasang kubectl serta memverifikasi koneksi ke cluster',
    'Menjalankan cluster lokal dengan Minikube driver Podman dan Kind',
    'Membawa image lokal ke cluster serta mengelola context dengan kubectx dan k9s'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Prasyarat: Podman Rootless, cgroups v2, dan subuid</h3><p>Cluster lokal seperti Minikube (driver Podman) dan Kind menjalankan node sebagai container. Karena itu seluruh dukungan cgroups harus lengkap di sisi host, terutama bila kamu memakai instalasi rootless:</p><ul><li><b>Podman rootless terpasang</b> dan berfungsi tanpa <code>sudo</code> (<code>podman run quay.io/podman/hello</code> harus sukses).</li><li><b>cgroups v2 aktif</b> — di Linux pastikan parameter boot <code>cgroup_no_v1=all</code> tersedia dan <code>podman info</code> menampilkan <code>cgroupVersion: v2</code>.</li><li><b>subuid/subgid terdaftar</b> — akunmu punya rentang UID sendiri di <code>/etc/subuid</code> dan <code>/etc/subgid</code> agar rootless container tidak berbenturan dengan UID asli.</li><li><b>macOS</b>: Podman berjalan di dalam <i>Podman machine</i>; cgroups v2 dan subuid sudah diatur oleh mesin virtual tersebut, jadi cukup pastikan mesinnya aktif.</li></ul>'
    },
    {
      type: 'example',
      title: 'Cek Kesiapan Podman &amp; Memasang kubectl',
      lang: 'bash',
      output: false,
      code: `# 1) Pastikan Podman sehat dan memakai cgroups v2
podman info | grep -i cgroup
#   diharapkan: cgroupVersion: v2

# 2) Pastikan rentang subuid/subgid terdaftar (Linux)
grep "\$USER" /etc/subuid /etc/subgid

# 3) Pasang kubectl
brew install kubectl            # macOS (Linux: gunakan paket resminya)

# 4) Verifikasi klien dan konfigurasi
kubectl version --client
ls -la ~/.kube/config           # berkas kredensial cluster`,
      explain: [
        'Perintah <code>podman info | grep -i cgroup</code> menampilkan versi cgroup dan pengelolanya; bila bukan v2, Minikube/Kind cenderung gagal saat start.',
        'Baris di <code>/etc/subuid</code> menjadi syarat rootless: tanpanya Podman menolak membuat container dengan mapping UID.',
        '<code>kubectl</code> hanyalah klien; ia membaca <code>~/.kube/config</code> untuk menentukan cluster mana yang dituju dan kredensial apa yang dipakai.',
        'Jika berkas konfigurasi belum ada, berarti belum ada cluster yang pernah dibuat di mesin ini.'
      ]
    },
    {
      type: 'text',
      html: `<h3>Minikube dengan Driver Podman</h3><p>Minikube menjalankan sebuah cluster Kubernetes satu node di dalam container (atau VM). Dengan flag <code>--driver=podman</code>, prosesnya berjalan langsung di atas engine Podman milikmu — cocok untuk lingkungan rootless tanpa lapisan Docker Desktop.</p><figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Alur dari kode ke podman build lalu load ke minikube atau kind dan kubectl apply">
        <rect x="30" y="60" width="140" height="60" rx="8" class="u-box"/>
        <text x="100" y="86" class="u-title" text-anchor="middle">Kode Aplikasi</text>
        <text x="100" y="106" class="u-lbl" text-anchor="middle">Dockerfile</text>
        <line x1="170" y1="90" x2="206" y2="90" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="210" y="60" width="150" height="60" rx="8" class="u-hd"/>
        <text x="285" y="86" class="u-title" text-anchor="middle">podman build</text>
        <text x="285" y="106" class="u-lbl" text-anchor="middle">image lokal</text>
        <line x1="360" y1="90" x2="396" y2="90" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="378" y="80" class="u-lbl" text-anchor="middle">load</text>
        <rect x="400" y="60" width="170" height="60" rx="8" class="u-hd"/>
        <text x="485" y="86" class="u-title" text-anchor="middle">minikube / kind</text>
        <text x="485" y="106" class="u-lbl" text-anchor="middle">cluster lokal</text>
        <line x1="570" y1="90" x2="606" y2="90" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="610" y="60" width="120" height="60" rx="8" class="u-box"/>
        <text x="670" y="86" class="u-title" text-anchor="middle">kubectl apply</text>
        <text x="670" y="106" class="u-lbl" text-anchor="middle">objek K8s</text>
        <rect x="30" y="170" width="160" height="60" rx="8" class="u-box"/>
        <text x="110" y="196" class="u-title" text-anchor="middle">manifest .yaml</text>
        <text x="110" y="216" class="u-lbl" text-anchor="middle">kubectl apply -f</text>
        <line x1="190" y1="200" x2="236" y2="200" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="240" y="170" width="190" height="60" rx="8" class="u-hd"/>
        <text x="335" y="196" class="u-title" text-anchor="middle">kube-apiserver</text>
        <text x="335" y="216" class="u-lbl" text-anchor="middle">control plane</text>
        <line x1="430" y1="200" x2="476" y2="200" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="480" y="170" width="250" height="60" rx="8" class="u-box"/>
        <text x="605" y="196" class="u-title" text-anchor="middle">Pod berjalan</text>
        <text x="605" y="216" class="u-lbl" text-anchor="middle">scheduler - kubelet - runtime</text>
        <text x="380" y="272" class="u-lbl" text-anchor="middle">Atas: bawa image lokal ke cluster — Bawah: serahkan manifest ke control plane</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 2.1</b> — Dua jalur wajib: memuat image lokal, lalu menerapkan manifest</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Siklus Hidup Minikube dan Memuat Image Lokal',
      lang: 'bash',
      output: false,
      code: `# Jalankan cluster dengan driver Podman
minikube start --driver=podman

# Cek status dan koneksi
minikube status
kubectl cluster-info
kubectl get nodes

# Buka dasbor web (berjalan di dalam cluster)
minikube dashboard

# Wajib: image hasil podman build tidak otomatis terbaca cluster
minikube image load web-app:1.0
# alternatif: minikube ssh -- podman pull web-app:1.0

# Berhenti sementara / hapus total
minikube stop
minikube delete`,
      explain: [
        'Dengan driver Podman, node Minikube berupa container Podman sehingga cluster ikut berjalan rootless di akunmu.',
        'Perintah <code>minikube image load</code> menyalin image dari penyimpanan Podman lokal ke dalam cluster; tanpanya pod akan berhenti di <code>ImagePullBackOff</code> karena image itu tidak ada di registry mana pun.',
        '<code>minikube status</code> mengecek apakah control plane dan node masih hidup, sedangkan <code>kubectl cluster-info</code> memastikan kubectl sudah menunjuk cluster yang benar.',
        'Gunakan <code>minikube stop</code> bila ingin mempertahankan data cluster, dan <code>minikube delete</code> bila ingin memulai dari awal.'
      ]
    },
    {
      type: 'example',
      title: 'Kind: 1 Control-Plane + 1 Worker',
      lang: 'bash',
      output: false,
      code: `# 1) Isi berkas kind-config.yaml
#  kind: Cluster
#  apiVersion: kind.x-k8s.io/v1alpha4
#  nodes:
#    - role: control-plane
#    - role: worker

# 2) Buat cluster sesuai konfigurasi
kind create cluster --config kind-config.yaml

# 3) Bawa image lokal hasil podman build ke cluster
kind load docker-image web-app:1.0

# 4) Verifikasi lalu hapus cluster
kind get clusters
kind delete cluster`,
      explain: [
        'Kind (Kubernetes in Container) menjalankan tiap node sebagai container, sehingga satu cluster multi-node bisa dibuat dalam hitungan detik.',
        'Konfigurasi <code>--config</code> memungkinkanmu menentukan jumlah dan peran node, sementara <code>kind load docker-image</code> menyuntikkan image lokal ke dalam node tersebut.',
        'Untuk rootless di atas Podman, pastikan cgroups v2 aktif di host dan konfigurasi rootless Podman sudah benar sebelum membuat cluster.',
        'Alternatif ringan lain: <b>K3s</b> (binary tunggal, cocok untuk server kecil) dan <b>MicroK8s</b> (distribusi snap dari Canonical) — keduanya berjalan langsung di OS, bukan sebagai container node.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Navigasi Cepat: Context, Namespace, dan TUI</h3><p>Satu komputer bisa menyimpan banyak cluster di <code>~/.kube/config</code>, dan satu cluster berisi banyak namespace. Berpindah secara manual memakai <code>config use-context</code> lama, karena itu tersedia alat bantu:</p><ul><li><b>kubectx</b> — <code>kubectx</code> menampilkan daftar context, <code>kubectx minikube</code> berpindah, dan <code>kubectx -</code> kembali ke context sebelumnya.</li><li><b>kubens</b> — <code>kubens</code> menampilkan namespace, <code>kubens dev</code> berpindah tanpa menulis <code>-n</code> di setiap perintah.</li><li><b>k9s</b> — TUI di terminal untuk memantau pod, log, dan event secara visual; tekan <code>:</code> lalu ketik resource untuk berpindah tampilan.</li><li><b>Alternatif ringan</b> — K3s dan MicroK8s cocok bila kamu butuh cluster dekat dengan OS, misalnya untuk server kecil atau belajar tanpa lapisan container tambahan.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Mulai dari Satu Penyedia',
      text: 'Untuk belajar, pilih satu penyedia dulu — Minikube driver Podman bila kamu ingin pengalaman "cluster dalam container" yang paling mirip produksi, atau Kind bila butuh multi-node cepat. Kombinasi <code>brew install kubectx</code> dan <code>brew install k9s</code> membuat navigasi jauh lebih nyaman sejak hari pertama.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Image yang kamu bangun dengan <code>podman build</code> tidak otomatis tersedia di dalam cluster. Selalu muat dulu dengan <code>minikube image load</code> atau <code>kind load docker-image</code>; jika dilewati, pod tersendat di status <code>ImagePullBackOff</code> karena cluster mencoba menarik image dari registry publik.'
    },
    {
      type: 'vocab',
      items: [
        ['kubectl', 'Klien baris perintah standar untuk berbicara dengan kube-apiserver.'],
        ['Context', 'Pasangan cluster, user, dan namespace aktif di ~/.kube/config yang dituju kubectl.'],
        ['Minikube', 'Penyedia cluster Kubernetes lokal satu node yang bisa memakai driver Podman.'],
        ['Kind', 'Alat membuat cluster Kubernetes dengan menjalankan tiap node sebagai container.'],
        ['subuid', 'Rentang UID milik pengguna yang dipakai Podman rootless untuk memetakan kepemilikan file.'],
        ['k9s', 'Antarmuka TUI berbasis terminal untuk memantau dan mengelola resource Kubernetes.']
      ]
    }
  ],
  recap: [
    'Siapkan dulu Podman rootless, cgroups v2, dan subuid; semua diperiksa lewat podman info.',
    'kubectl hanya klien — ia membaca ~/.kube/config untuk menentukan tujuan cluster.',
    'Minikube driver Podman dan Kind adalah dua pilihan utama cluster lokal; keduanya berjalan rootless di atas Podman.',
    'Image lokal wajib dimuat dengan minikube image load atau kind load docker-image sebelum pod bisa berjalan.',
    'kubectx, kubens, dan k9s mempercepat perpindahan context, namespace, dan pemantauan resource.'
  ]
});
