/* ============================================================
   Pelajaran Kubernetes — Bab 1: Pengantar Kubernetes & Orkestrasi Container
   ============================================================ */
'use strict';

window.KUBERNETES_LESSONS = window.KUBERNETES_LESSONS || [];

window.KUBERNETES_LESSONS.push({
  id: 'pengantar-kubernetes',
  title: 'Pengantar Kubernetes & Orkestrasi Container',
  chapter: 'Pengenalan',
  duration: '8–10 menit',
  intro: [
    'Menjalankan satu container di laptop itu mudah. Masalah muncul ketika aplikasi yang sama harus berjalan di lima server: satu container mati tanpa diganti, update dilakukan satu per satu, dan konfigurasi di tiap mesin mulai berbeda. Di sinilah pengelolaan manual berhenti efektif.',
    '<b>Orkestrasi container</b> adalah lapisan otomatisasi di atas container yang menjalankan, memantau, mengganti, dan menyeimbangkan beban container secara otomatis. <b>Kubernetes</b> adalah platform orkestrasi container yang paling luas dipakai di industri, lahir dari pengalaman Google mengelola layanan raksasa lewat sistem bernama <b>Borg</b>, lalu diserahkan ke <b>CNCF</b> (Cloud Native Computing Foundation) sejak 2015.',
    'Bab ini membahas manfaat utama Kubernetes, arsitektur cluster (Control Plane dan Node), cara kerja deklaratif berbasis <i>desired state</i>, serta posisi container runtime lewat <b>CRI</b> — termasuk kaitannya dengan Podman yang dipakai sebagai engine lokal di materi ini.'
  ],
  objectives: [
    'Memahami keterbatasan pengelolaan container secara manual',
    'Mengetahui manfaat utama Kubernetes sebagai platform orkestrasi',
    'Mengenali komponen Control Plane dan Node dalam sebuah cluster',
    'Memahami konsep deklaratif: desired state, current state, dan proses reconcile'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Ketika Container Dikelola Manual</h3><p>Pada materi Docker di situs ini, kamu sudah membangun image dan menjalankan container dengan <code>podman run</code>. Untuk satu atau dua container, cara itu sudah cukup. Namun begitu jumlahnya puluhan, muncul masalah berulang:</p><ul><li><b>Container mati tidak diganti</b> — proses crash tengah malam dan layanan baru pulih saat orang membukanya.</li><li><b>Update penuh risiko</b> — setiap server diganti satu per satu sehingga versi aplikasi sempat campur dan pengguna melihat error.</li><li><b>Konfigurasi menyebar</b> — file konfigurasi disalin ke banyak mesin dan lama-lama tidak ada yang tahu mana yang benar.</li><li><b>Sulit menskalakan</b> — menambah instance berarti mengulang langkah yang sama di setiap server.</li></ul><p>Semua masalah itu sebenarnya bukan masalah container, melainkan masalah <b>koordinasi</b>. Karena itu dibutuhkan satu pihak yang melihat seluruh cluster dan menjaga semuanya tetap sesuai rencana.</p>'
    },
    {
      type: 'text',
      html: '<h3>Apa itu Kubernetes?</h3><p>Kubernetes (sering disingkat K8s) adalah platform sumber terbuka untuk <b>mengelola workload container berskala besar</b>: penjadwalan, penyebaran, penemuan layanan, pemulihan otomatis, dan penskalaan. Nama ini diambil dari bahasa Yunani yang berarti "juru mudi", mencerminkan perannya sebagai pengendali armada container.</p><p>Kubernetes bukan proyek eksperimental: proyek ini lahir dari <b>Google Borg</b>, sistem orkestrasi internal yang sudah menopang pencarian dan layanan Google selama lebih dari satu dekade, kemudian diserahkan ke <b>Cloud Native Computing Foundation (CNCF)</b> sebagai proyek kelulusan pertamanya.</p><p>Manfaat yang paling sering dicari dari Kubernetes:</p><ul><li><b>Self-healing</b> — container yang mati diganti otomatis, pod yang gagal dijalankan ulang.</li><li><b>Autoscaling</b> — jumlah replica menyesuaikan beban CPU/RAM atau metrik kustom.</li><li><b>Rolling update &amp; rollback</b> — penyebaran bertahap tanpa downtime, dan kembali ke versi lama bila ada masalah.</li><li><b>Service discovery &amp; load balancing</b> — pod ditemukan lewat nama layanan dan trafik dibagi rata.</li><li><b>Manajemen config &amp; secret</b> — konfigurasi dan data sensitif dipisahkan dari image.</li><li><b>Storage orchestration</b> — volume persisten dipasang sesuai kebutuhan pod.</li></ul>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 350" width="760" role="img" aria-label="Arsitektur cluster Kubernetes dengan satu control plane dan dua node berisi pod">
        <rect x="210" y="36" width="340" height="130" rx="10" class="u-box"/>
        <text x="380" y="60" class="u-title" text-anchor="middle">Control Plane</text>
        <line x1="225" y1="72" x2="535" y2="72" class="u-line"/>
        <rect x="225" y="84" width="155" height="30" rx="6" class="u-hd"/>
        <text x="302" y="103" class="u-lbl" text-anchor="middle">kube-apiserver</text>
        <rect x="390" y="84" width="155" height="30" rx="6" class="u-box"/>
        <text x="467" y="103" class="u-lbl" text-anchor="middle">etcd</text>
        <rect x="225" y="122" width="155" height="30" rx="6" class="u-box"/>
        <text x="302" y="141" class="u-lbl" text-anchor="middle">kube-scheduler</text>
        <rect x="390" y="122" width="155" height="30" rx="6" class="u-box"/>
        <text x="467" y="141" class="u-lbl" text-anchor="middle">kube-controller-manager</text>
        <line x1="340" y1="166" x2="175" y2="196" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="420" y1="166" x2="585" y2="196" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="380" y="192" class="u-lbl" text-anchor="middle">perintah &amp; status</text>
        <rect x="40" y="200" width="260" height="130" rx="10" class="u-box"/>
        <text x="170" y="222" class="u-title" text-anchor="middle">Node 1 (Worker)</text>
        <line x1="55" y1="232" x2="285" y2="232" class="u-line"/>
        <rect x="55" y="242" width="115" height="30" rx="6" class="u-hd"/>
        <text x="112" y="261" class="u-lbl" text-anchor="middle">kubelet</text>
        <rect x="180" y="242" width="105" height="30" rx="6" class="u-box"/>
        <text x="232" y="261" class="u-lbl" text-anchor="middle">kube-proxy</text>
        <rect x="55" y="278" width="115" height="30" rx="6" class="u-box"/>
        <text x="112" y="297" class="u-lbl" text-anchor="middle">runtime (CRI)</text>
        <rect x="180" y="278" width="105" height="30" rx="6" class="u-hd"/>
        <text x="232" y="297" class="u-lbl" text-anchor="middle">Pod A</text>
        <rect x="460" y="200" width="260" height="130" rx="10" class="u-box"/>
        <text x="590" y="222" class="u-title" text-anchor="middle">Node 2 (Worker)</text>
        <line x1="475" y1="232" x2="705" y2="232" class="u-line"/>
        <rect x="475" y="242" width="115" height="30" rx="6" class="u-hd"/>
        <text x="532" y="261" class="u-lbl" text-anchor="middle">kubelet</text>
        <rect x="600" y="242" width="105" height="30" rx="6" class="u-box"/>
        <text x="652" y="261" class="u-lbl" text-anchor="middle">kube-proxy</text>
        <rect x="475" y="278" width="115" height="30" rx="6" class="u-box"/>
        <text x="532" y="297" class="u-lbl" text-anchor="middle">runtime (CRI)</text>
        <rect x="600" y="278" width="105" height="30" rx="6" class="u-hd"/>
        <text x="652" y="297" class="u-lbl" text-anchor="middle">Pod B</text>
        <text x="380" y="346" class="u-lbl" text-anchor="middle">Control Plane menyimpan keinginan; Node menjalankan Pod melalui kubelet</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 1.1</b> — Arsitektur cluster Kubernetes: satu Control Plane dan dua Node pekerja</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Dua Cara Memberi Instruksi: Imperatif vs Deklaratif',
      lang: 'bash',
      output: false,
      code: `# Imperatif: perintah dieksekusi apa adanya, tanpa menyimpan rencana
kubectl create deployment web --image=nginx:alpine

# Deklaratif: tulis keadaan yang diinginkan, lalu serahkan ke cluster
kubectl apply -f web.yaml

# Keadaan nyata selalu dicek ulang terhadap isi web.yaml
kubectl get deployment web`,
      explain: [
        'Pendekatan imperatif cocok untuk percobaan cepat karena kamu menyebut tindakan yang harus dilakukan saat itu juga.',
        'Pendekatan deklaratif menyimpan keinginanmu dalam berkas manifest, sehingga bisa diperiksa, diulang, dan dikelola bersama tim lewat version control.',
        'Kubernetes bekerja dengan <i>desired state</i> (keadaan yang diinginkan) dan <i>current state</i> (keadaan nyata); controller terus membandingkan keduanya lalu memperbaiki selisihnya — proses ini disebut <b>reconcile</b>.',
        'Bila kamu menghapus satu pod dari deployment, controller langsung membuat pod pengganti karena current state berbeda dari desired state.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh Manifest Deklaratif (Desired State)',
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
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: nginx
          image: nginx:alpine
          ports:
            - containerPort: 80`,
      explain: [
        'Berkas ini menyatakan: "Saya menginginkan 3 salinan container nginx berlabel app: web".',
        'Field <code>replicas: 3</code> adalah desired state; jika jumlah pod berubah karena crash, controller mengembalikannya ke 3.',
        'Field <code>selector</code> dan <code>labels</code> menghubungkan deployment dengan pod yang ia kelola — keduanya wajib konsisten.',
        'Manifest semacam inilah yang nantinya kamu tulis, simpan di repository, dan jalankan dengan <code>kubectl apply -f</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Lapisan Eksekusi: dari Perintah sampai Container',
      lang: 'text',
      output: false,
      code: `kubectl apply -f web.yaml
        ↓
kube-apiserver (Control Plane)  →  menyimpan desired state di etcd
        ↓
kube-scheduler                  →  memilih node paling cocok untuk pod
        ↓
kubelet (di node terpilih)      →  memerintahkan runtime menjalankan pod
        ↓
CRI (Container Runtime Interface) →  CRI-O / containerd
        ↓
container berjalan               →  status dilaporkan kembali ke apiserver`,
      explain: [
        'Kubernetes tidak pernah berbicara langsung kepada container runtime; ia memakai antarmuka standar bernama <b>CRI (Container Runtime Interface)</b>.',
        'Runtime yang umum dipakai lewat CRI adalah <b>CRI-O</b> dan <b>containerd</b>, keduanya tersedia di hampir semua distribusi Kubernetes modern.',
        'Integrasi Docker lama (dockershim) sudah dihapus sejak Kubernetes 1.24, sehingga komponen seperti CRI-O menjadi jalur resmi.',
        'Di lokal, kamu tetap memakai <b>Podman</b> sebagai engine rootless: image dibangun dengan Podman, lalu cluster (Minikube/Kind) memuatnya untuk dijalankan.'
      ]
    },
    {
      type: 'tip',
      title: 'Jembatan dari Materi Docker',
      text: 'Konsep image, Dockerfile, volume, dan jaringan dari materi Docker tetap berlaku utuh di Kubernetes. Yang berubah hanya cara membacanya: kamu tidak lagi menulis perintah "jalankan container ini", tetapi menulis deklarasi "begini seharusnya keadaan cluster" lalu Kubernetes yang mengeksekusinya.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Kubernetes bukan pengganti container runtime, melainkan pengelolanya. Jangan mengharapkan perintah seperti <code>docker run</code> bekerja di dalam cluster; jalur resminya adalah manifest yang dikirim ke kube-apiserver, lalu dieksekusi kubelet melalui CRI.'
    },
    {
      type: 'vocab',
      items: [
        ['Orkestrasi Container', 'Otomatisasi penjadwalan, penggantian, penskalaan, dan penyebaran trafik untuk banyak container di beberapa server.'],
        ['Cluster', 'Kumpulan mesin (node) beserta control plane yang dikelola bersama oleh satu instalasi Kubernetes.'],
        ['Control Plane', 'Komponen pengambil keputusan cluster: kube-apiserver, etcd, kube-scheduler, dan kube-controller-manager.'],
        ['Node', 'Mesin pekerja yang menjalankan pod melalui kubelet dan container runtime.'],
        ['Desired State', 'Keadaan cluster yang kamu tulis dalam manifest dan diinginkan selalu tercapai.'],
        ['Reconcile', 'Siklus perbandingan desired state dengan current state oleh controller, lalu memperbaiki selisihnya.'],
        ['CRI (Container Runtime Interface)', 'Antarmuka standar yang dipakai Kubernetes untuk meminta container runtime menjalankan pod.']
      ]
    }
  ],
  recap: [
    'Masalah utama container manual adalah koordinasi: penggantian, update, dan konfigurasi yang menyebar di banyak server.',
    'Kubernetes menyediakan self-healing, autoscaling, rolling update, service discovery, manajemen config/secret, dan storage orchestration.',
    'Cluster terdiri dari Control Plane (pengambil keputusan) dan Node (pelaksana pod melalui kubelet dan runtime CRI).',
    'Kubernetes bekerja deklaratif: kamu menulis desired state, lalu controller melakukan reconcile terhadap current state.'
  ]
});
