/* ============================================================
   Pelajaran Kubernetes — Bab 3: Pod — Unit Terkecil di Kubernetes
   ============================================================ */
'use strict';

window.KUBERNETES_LESSONS = window.KUBERNETES_LESSONS || [];

window.KUBERNETES_LESSONS.push({
  id: 'pod-dasar',
  title: 'Pod: Unit Terkecil di Kubernetes',
  chapter: 'Objek Inti',
  duration: '8–10 menit',
  intro: [
    'Setiap kali deployment gagal atau aplikasi tidak bisa diakses, penyebabnya hampir selalu berpulang pada satu hal: tidak memahami apa yang sebenarnya dijalankan di dalam cluster. Langkah pertama memahaminya adalah mengenal <b>Pod</b>, objek yang paling sering muncul saat kamu menjalankan <code>kubectl get pods</code>.',
    'Pod adalah unit terkecil yang bisa dijadwalkan Kubernetes: satu atau beberapa container yang berbagi network namespace, IP yang sama, dan volume yang sama. Container di dalam pod saling mengakses lewat <code>localhost</code> persis seolah berada di satu mesin.',
    'Bab ini membedah struktur manifest Pod lengkap, arti tiap field penting, status (phase) yang mungkin muncul, pola container majemuk (sidecar, adapter, ambassador), serta perintah kubectl sehari-hari untuk mengamati pod.'
  ],
  objectives: [
    'Memahami definisi Pod dan pembagian resource antar container di dalamnya',
    'Membaca struktur manifest Pod beserta field-field utamanya',
    'Menjelaskan arti restartPolicy dan setiap status phase pod',
    'Menjalankan pod serta memeriksanya memakai perintah kubectl'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Apa itu Pod?</h3><p>Pod (bahasa Inggris: "kacang polong") adalah pembungkus untuk satu atau lebih container yang <b>dijadwalkan bersama di node yang sama</b> dan selalu hidup sebagai satu kesatuan. Container dalam satu pod berbagi IP pod, loopback interface, dan seluruh volume yang dideklarasikan — sehingga komunikasi antar container cukup lewat <code>localhost:port</code>.</p><p>Pod bersifat <b>tidak abadi (ephemeral)</b>: pod yang mati tidak diperbaiki, melainkan digantikan pod baru oleh objek yang lebih tinggi. Pod juga tidak pernah "dipindah" antar node; jika node mati, pod dibuat ulang di node lain oleh controller.</p><p>Karena container dalam satu pod selalu berjalan bersama, pola umum container majemuk adalah:</p><ul><li><b>Sidecar</b> — pelengkap kontinu, misalnya pengirim log atau proxy yang berjalan di samping aplikasi utama.</li><li><b>Adapter</b> — penyesuaian keluar, misalnya mengubah format output aplikasi menjadi standar monitoring.</li><li><b>Ambassador</b> — jembatan keluar, misalnya proxy yang menyederhanakan akses ke layanan eksternal.</li></ul>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 320" width="760" role="img" aria-label="Anatomi Pod berisi container pause, aplikasi, sidecar, dan volume bersama dengan satu IP pod">
        <rect x="40" y="36" width="520" height="250" rx="10" class="u-box"/>
        <text x="300" y="60" class="u-title" text-anchor="middle">Pod — IP 10.244.0.15</text>
        <line x1="60" y1="72" x2="540" y2="72" class="u-line"/>
        <rect x="60" y="84" width="120" height="48" rx="6" class="u-hd"/>
        <text x="120" y="104" class="u-title" text-anchor="middle">pause</text>
        <text x="120" y="122" class="u-lbl" text-anchor="middle">sandbox jaringan</text>
        <rect x="195" y="84" width="140" height="48" rx="6" class="u-box"/>
        <text x="265" y="104" class="u-title" text-anchor="middle">app (nginx)</text>
        <text x="265" y="122" class="u-lbl" text-anchor="middle">port 80</text>
        <rect x="350" y="84" width="140" height="48" rx="6" class="u-box"/>
        <text x="420" y="104" class="u-title" text-anchor="middle">sidecar</text>
        <text x="420" y="122" class="u-lbl" text-anchor="middle">log shipper</text>
        <rect x="60" y="150" width="430" height="40" rx="6" class="u-hd"/>
        <text x="275" y="175" class="u-title" text-anchor="middle">volume bersama (emptyDir)</text>
        <text x="300" y="216" class="u-lbl" text-anchor="middle">semua container memakai network namespace yang sama</text>
        <text x="300" y="238" class="u-lbl" text-anchor="middle">saling mengakses lewat localhost</text>
        <text x="300" y="260" class="u-lbl" text-anchor="middle">satu IP pod, satu volume root untuk tiap container</text>
        <rect x="620" y="84" width="110" height="48" rx="6" class="u-box"/>
        <text x="675" y="104" class="u-title" text-anchor="middle">Service</text>
        <text x="675" y="122" class="u-lbl" text-anchor="middle">ClusterIP</text>
        <line x1="620" y1="108" x2="566" y2="108" class="u-dash" marker-end="url(#u-arrow)"/>
        <text x="593" y="98" class="u-lbl" text-anchor="middle">trafik</text>
        <text x="380" y="312" class="u-lbl" text-anchor="middle">Pod adalah unit terkecil yang dijadwalkan — isinya hidup dan mati bersama</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 3.1</b> — Anatomi Pod: container pause sebagai sandbox, container aplikasi, sidecar, dan volume bersama</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Struktur Manifest Pod</h3><p>Manifest Pod ditulis dalam YAML/JSON dan selalu memuat empat bagian inti: <code>apiVersion</code> (versi API yang dipakai, untuk Pod selalu <code>v1</code>), <code>kind</code> (jenis objek), <code>metadata</code> (nama, label, namespace), dan <code>spec</code> (keadaan yang diinginkan). Di dalam <code>spec.containers[]</code> kamu menentukan detail tiap container:</p><ul><li><b>image</b> — image beserta tagnya; sebaiknya selalu tag eksplisit, bukan <code>latest</code>.</li><li><b>ports</b> — daftar port container agar mudah dirujuk oleh Service.</li><li><b>command</b> — mengganti entrypoint bila image tidak menjalankan proses yang diharapkan.</li><li><b>resources</b> — <code>requests</code> (kebutuhan saat penjadwalan) dan <code>limits</code> (batas maksimum).</li><li><b>env</b> — variabel lingkungan, nilai tetap atau diambil dari ConfigMap/Secret.</li><li><b>imagePullPolicy</b> — <code>Always</code>, <code>IfNotPresent</code>, atau <code>Never</code>.</li></ul><p>Field lain di tingkat pod adalah <code>restartPolicy</code> dengan tiga pilihan: <b>Always</b> (default, restart container yang berhenti), <b>OnFailure</b> (restart hanya bila exit code bukan nol), dan <b>Never</b> (tidak pernah restart — dipakai untuk Job).</p>'
    },
    {
      type: 'example',
      title: 'Manifest Pod nginx Lengkap',
      lang: 'yaml',
      output: false,
      code: `apiVersion: v1
kind: Pod
metadata:
  name: web-nginx
  namespace: default
  labels:
    app: web
spec:
  restartPolicy: Always
  containers:
    - name: nginx
      image: nginx:1.27-alpine
      imagePullPolicy: IfNotPresent
      ports:
        - containerPort: 80
      env:
        - name: MODE
          value: "production"
      resources:
        requests:
          cpu: "100m"
          memory: "64Mi"
        limits:
          cpu: "250m"
          memory: "128Mi"`,
      explain: [
        '<code>metadata.name</code> harus unik di dalam namespace-nya, sedangkan <code>labels</code> dipakai oleh controller dan Service untuk menemukan pod ini.',
        '<code>image: nginx:1.27-alpine</code> memakai tag versi eksplisit sehingga pod selalu memakai build yang sama di setiap lingkungan.',
        '<code>requests</code> dipakai scheduler saat menempatkan pod, sementara <code>limits</code> membatasi pemakaian agar pod tidak menyeret resource milik pod lain.',
        'Dengan <code>imagePullPolicy: IfNotPresent</code>, image yang sudah ada di node dipakai ulang — selaras dengan workflow Podman yang memuat image lokal ke cluster.',
        'Manifest ini langsung bisa dijalankan dengan <code>kubectl apply -f</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Arti Status (Phase) Pod',
      lang: 'text',
      output: false,
      code: `Pending    pod diterima cluster, menunggu penjadwalan atau penarikan image
Running    semua container berjalan; pod sudah menempati sebuah node
Succeeded  pod berhenti dengan sukses (exit code 0) — umum untuk Job
Failed     pod berhenti dengan gagal (exit code bukan 0)
Unknown    status tidak diketahui — komunikasi dengan node terputus`,
      explain: [
        '<b>Pending</b> yang lama biasanya berarti image tidak bisa ditarik atau tidak ada node dengan resource yang cukup.',
        '<b>Running</b> tidak menjamin aplikasi sehat; container bisa berjalan tetapi aplikasinya error, sehingga perlu dicek lewat <code>kubectl logs</code> dan probe kesehatan.',
        '<b>Succeeded</b> dan <b>Failed</b> adalah status akhir yang umum pada pod tipe Job, sedangkan pod workload biasa akan selalu dikembalikan ke Running oleh controller.',
        '<b>Unknown</b> hampir selalu menunjuk masalah komunikasi kubelet dengan node, misalnya karena node tidak bisa dihubungi.'
      ]
    },
    {
      type: 'example',
      title: 'Menjalankan dan Mengamati Pod dengan kubectl',
      lang: 'bash',
      output: false,
      code: `# Terapkan manifest lalu pantau
kubectl apply -f pod-nginx.yaml
kubectl get pod -o wide          # IP, node, phase, umur
kubectl describe pod web-nginx   # event & detail konfigurasi

# Log dan masuk ke dalam container
kubectl logs -f web-nginx
kubectl exec -it web-nginx -- sh

# Cara singkat tanpa manifest
kubectl run web-nginx2 --image=nginx:1.27-alpine --port=80

# Bersihkan pod percobaan
kubectl delete pod web-nginx web-nginx2`,
      explain: [
        '<code>kubectl apply -f</code> mengirim manifest ke kube-apiserver, lalu scheduler dan kubelet bekerja hingga pod benar-benar berjalan.',
        '<code>kubectl describe</code> menampilkan konfigurasi final, IP, event, dan penyebab kegagalan — jalur pertama saat pod tidak masuk status Running.',
        '<code>kubectl logs -f</code> mengikuti log container, sedangkan <code>kubectl exec -it ... -- sh</code> membuka shell interaktif di dalam pod untuk pemeriksaan langsung.',
        '<code>kubectl run</code> menghasilkan pod sederhana tanpa manifest; cocok untuk percobaan cepat sebelum ditulis deklaratif.'
      ]
    },
    {
      type: 'tip',
      title: 'Urutan Diagnosis Pod',
      text: 'Saat pod bermasalah, ikuti urutan ini: <code>kubectl get pod -o wide</code> untuk melihat phase dan node, lalu <code>kubectl describe pod</code> untuk membaca bagian Events, baru <code>kubectl logs</code> dan <code>kubectl exec</code> untuk masuk ke aplikasinya. Bagian Events hampir selalu menyebut penyebabnya lebih dahulu daripada log aplikasi.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Pod dibuat langsung bersifat sementara: begitu dihapus, di-evict, atau node-nya mati, pod tidak pernah kembali dengan sendirinya. Untuk penggunaan serius, bungkus pod dalam <b>Deployment</b> yang menjaga jumlah replica dan menangani update — khusus untuk beban berstatus (stateful), gunakan StatefulSet.'
    },
    {
      type: 'vocab',
      items: [
        ['Pod', 'Unit terkecil yang bisa dijadwalkan Kubernetes: satu atau lebih container berbagi IP, network namespace, dan volume.'],
        ['Sandbox (pause container)', 'Container kecil yang membuat jaringan dan IPC pod sebelum container aplikasi dijalankan di dalamnya.'],
        ['Sidecar', 'Container pelengkap yang berjalan terus-menerus di samping container utama, misalnya pengirim log.'],
        ['restartPolicy', 'Aturan penjalanan ulang container pod: Always, OnFailure, atau Never.'],
        ['Phase', 'Status ringkas pod: Pending, Running, Succeeded, Failed, atau Unknown.'],
        ['imagePullPolicy', 'Aturan pengambilan image: Always, IfNotPresent, atau Never.'],
        ['Ephemeral', 'Sifat sementara pod — dibuat, diganti, dan dibuang oleh controller, bukan dipindah.']
      ]
    }
  ],
  recap: [
    'Pod adalah unit terkecil yang dijadwalkan: container di dalamnya berbagi IP, network namespace, dan volume.',
    'Manifest Pod terdiri dari apiVersion, kind, metadata, dan spec berisi daftar containers beserta image, ports, resources, env, dan imagePullPolicy.',
    'restartPolicy menentukan kapan container dijalankan ulang; phase memberi tahu posisi status pod saat ini.',
    'Polanya majemuk: sidecar melengkapi, adapter menyesuaikan output, ambassador menjadi jembatan ke luar.',
    'Diagnosis harian memakai kubectl get, describe, logs, dan exec; pod langsung hanya untuk percobaan, produksi memakai Deployment.'
  ]
});
