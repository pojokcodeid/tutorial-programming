/* ============================================================
   Pelajaran Kubernetes — Bab 9: Storage — Volume, PV & PVC
   ============================================================ */
'use strict';

window.KUBERNETES_LESSONS = window.KUBERNETES_LESSONS || [];

window.KUBERNETES_LESSONS.push({
  id: 'storage-pv-pvc',
  title: 'Storage: Volume, PV & PVC',
  chapter: 'Jaringan & Storage',
  duration: '8–10 menit',
  intro: [
    'Aplikasi CRUD-mu berjalan mulus di Kubernetes sampai suatu hari data yang baru saja disimpan lenyap begitu Pod di-restart. Penyebabnya bukan bug, melainkan desain: filesystem container bersifat sementara dan seluruh perubahan ikut hilang bersama container.',
    'Untuk data yang harus bertahan, Kubernetes menyediakan dua objek pokok: <b>PersistentVolume (PV)</b> sebagai penyimpanan nyata di cluster, dan <b>PersistentVolumeClaim (PVC)</b> sebagai permintaan pengguna yang meminta kapasitas serta mode akses tertentu. Di atas keduanya ada <b>StorageClass</b> yang membuat volume secara otomatis (dynamic provisioning) sehingga administrator tidak perlu membuat PV satu per satu.',
    'Bab ini membahas volume sementara emptyDir, siklus hidup PV dan PVC beserta accessModes dan reclaimPolicy, cara memasang volume ke Pod, serta cara memeriksa status penyimpanan di cluster.'
  ],
  objectives: [
    'Membedakan data sementara (emptyDir) dan data yang harus bertahan (volume)',
    'Memahami peran PersistentVolume dan PersistentVolumeClaim beserta accessModes-nya',
    'Mengenal StorageClass dan dynamic provisioning di Minikube maupun Kind',
    'Mampu memasang PVC ke Pod atau Deployment dan memeriksanya dengan kubectl'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Data Hilang Saat Container Mati</h3><p>Filesystem container bersifat sementara: setiap perubahan ditulis ke lapisan yang ikut terhapus ketika container berhenti, dan Pod yang direstart atau berpindah node praktis memulai dari nol. Untuk cache, file sementara, dan buffer, kondisi ini justru diinginkan karena membuat aplikasi tetap stateless.</p><p>Kubernetes menyediakan <b>emptyDir</b>, sebuah direktori kosong yang dibuat khusus untuk sebuah Pod. Data di dalamnya bertahan selama Pod masih berada di node yang sama — termasuk ketika salah satu container di dalam Pod di-restart — tetapi sepenuhnya dihapus ketika Pod dihapus dari cluster.</p>'
    },
    {
      type: 'example',
      title: 'Pod dengan Volume emptyDir',
      lang: 'yaml',
      output: false,
      code: `apiVersion: v1
kind: Pod
metadata:
  name: scratch-pad
spec:
  containers:
    - name: app
      image: docker.io/nginxinc/nginx-unprivileged:1.27
      ports:
        - containerPort: 8080
      volumeMounts:
        - name: scratch
          mountPath: /tmp/cache
  volumes:
    - name: scratch
      emptyDir: {}`,
      explain: [
        'Blok volumes didefinisikan di tingkat Pod, lalu setiap container merujuknya lewat volumeMounts dengan mountPath yang diinginkan.',
        'emptyDir: {} berarti Kubernetes membuat direktori kosong di penyimpanan node; kamu bisa menambahkan medium: Memory agar volume justru memakai RAM node.',
        'Direktori /tmp/cache kini menjadi tempat aman menaruh file sementara tanpa takut kehilangan data ketika container di-restart.',
        'Begitu Pod dihapus, direktori beserta isinya ikut lenyap; emptyDir bukan solusi untuk data yang harus bertahan.'
      ]
    },
    {
      type: 'text',
      html: '<h3>PersistentVolume dan PersistentVolumeClaim</h3><p><b>PersistentVolume (PV)</b> adalah objek klaster yang mewakili penyimpanan nyata: kapasitas tertentu pada host, NFS, atau penyedia cloud. Umumnya PV dibuat oleh administrator klaster atau otomatis oleh StorageClass sebelum aplikasi membutuhkannya.</p><p><b>PersistentVolumeClaim (PVC)</b> adalah sisi pengguna: sebuah permintaan berbentuk "saya butuh 512Mi dengan mode baca-tulis sekali". Saat PVC dibuat, klaster mencari PV yang cocok — kapasitas cukup, accessMode sesuai, dan storageClassName sama — lalu mengikatnya (binding).</p><ul><li><b>ReadWriteOnce (RWO)</b> – volume boleh dipasang sebagai baca-tulis oleh satu node saja.</li><li><b>ReadOnlyMany (ROX)</b> – banyak node boleh memasang secara baca-saja.</li><li><b>ReadWriteMany (RWX)</b> – banyak node boleh memasang sekaligus baca-tulis, tetapi harus didukung backend penyimpanan seperti NFS atau beberapa penyedia CSI.</li><li><b>reclaimPolicy</b> – menentukan nasib data setelah PVC dilepas: Retain menyimpan PV beserta datanya, sedangkan Delete menghapus volume otomatis oleh provisioner.</li></ul>'
    },
    {
      type: 'text',
      html: `<h3>Dynamic Provisioning dengan StorageClass</h3><p>Membuat PV satu per satu tidak skala. <b>StorageClass</b> mendefinisikan resep penyimpanan yang memuat provisioner, parameter, dan reclaimPolicy bawaan. Ketika kamu membuat PVC tanpa menentukan storageClassName (atau menunjuk kelas tertentu), provisioner di belakang StorageClass akan membuatkan PV secara otomatis sesuai permintaan — pola ini disebut dynamic provisioning.</p><figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Alur dari Pod ke PVC, lalu binding ke PV yang dibuat StorageClass, dan terakhir ke backend penyimpanan">
        <rect x="20" y="120" width="132" height="72" rx="8" class="u-box"/>
        <text x="86" y="146" class="u-title">Pod / Deployment</text>
        <text x="86" y="166" class="u-lbl" text-anchor="middle">mountPath /data</text>
        <text x="86" y="184" class="u-sub" text-anchor="middle">claimName</text>
        <line x1="154" y1="156" x2="190" y2="156" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="194" y="120" width="144" height="72" rx="8" class="u-hd"/>
        <text x="266" y="146" class="u-title">PVC</text>
        <text x="266" y="166" class="u-lbl" text-anchor="middle">web-claim</text>
        <text x="266" y="184" class="u-sub" text-anchor="middle">512Mi RWO</text>
        <line x1="340" y1="156" x2="374" y2="156" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="357" y="146" class="u-lbl" text-anchor="middle">binding</text>
        <rect x="378" y="120" width="150" height="72" rx="8" class="u-box"/>
        <text x="453" y="146" class="u-title">PV</text>
        <text x="453" y="166" class="u-lbl" text-anchor="middle">pv-x1y2 · 1Gi</text>
        <text x="453" y="184" class="u-sub" text-anchor="middle">RWO · Retain</text>
        <rect x="378" y="22" width="150" height="62" rx="8" class="u-box"/>
        <text x="453" y="46" class="u-title">StorageClass</text>
        <text x="453" y="66" class="u-lbl" text-anchor="middle">standard (default)</text>
        <text x="453" y="80" class="u-sub" text-anchor="middle">provisioner</text>
        <line x1="453" y1="84" x2="453" y2="114" class="u-dash" marker-end="url(#u-arrow)"/>
        <text x="463" y="104" class="u-lbl">buat PV otomatis</text>
        <line x1="530" y1="156" x2="566" y2="156" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="570" y="120" width="170" height="72" rx="8" class="u-hd"/>
        <text x="655" y="146" class="u-title">Backend Penyimpanan</text>
        <text x="655" y="166" class="u-lbl" text-anchor="middle">hostPath / NFS / CSI</text>
        <text x="655" y="184" class="u-sub" text-anchor="middle">media data sesungguhnya</text>
        <text x="20" y="272" class="u-lbl">Tanpa provisioner, kamu membuat PV secara manual lalu mengikatnya ke PVC yang cocok</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 9.1</b> — PVC meminta kapasitas, StorageClass membuatkan PV, lalu Pod memasangnya sebagai volume</figcaption></figure><p>Di Minikube, provisioner bawaan adalah <code>k8s.io/minikube-hostpath</code>; di Kind, klaster memakai StorageClass bernama <code>standard</code> dengan provisioner <code>rancher.io/local-path</code>. Keduanya menyimpan data pada direktori milik node, sehingga sangat cocok untuk pengembangan lokal.</p>`
    },
    {
      type: 'example',
      title: 'PV, PVC, dan Deployment yang Memakainya',
      lang: 'yaml',
      output: false,
      code: `apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-data
spec:
  capacity:
    storage: 1Gi
  accessModes:
    - ReadWriteOnce
  storageClassName: manual
  persistentVolumeReclaimPolicy: Retain
  hostPath:
    path: /data/web-app        # hanya layak untuk cluster lokal
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: web-claim
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: manual
  resources:
    requests:
      storage: 512Mi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 1                  # RWO hanya untuk satu node
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
          image: docker.io/nginxinc/nginx-unprivileged:1.27
          ports:
            - containerPort: 8080
          volumeMounts:
            - name: data
              mountPath: /usr/share/nginx/html
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: web-claim`,
      explain: [
        'PV dan PVC dibuat secara manual dengan storageClassName: manual pada keduanya agar terjadi binding manual, bukan dynamic provisioning oleh StorageClass default.',
        'Kapasitas PV (1Gi) lebih besar daripada permintaan PVC (512Mi); hal itu diperbolehkan karena selisihnya dianggap kapasitas yang belum terpakai.',
        'Deployment memasang PVC ke container lewat dua bagian sekaligus: persistentVolumeClaim.claimName di tingkat Pod dan volumeMounts di tingkat container.',
        'Setelah semua objek dibuat, jalankan kubectl get pvc dan pastikan STATUS PVC sudah berubah menjadi Bound sebelum menguji aplikasinya.'
      ]
    },
    {
      type: 'example',
      title: 'Memeriksa Status Penyimpanan Cluster',
      lang: 'bash',
      output: false,
      code: `# 1. Lihat StorageClass yang tersedia (default ditandai "(default)")
kubectl get sc

# 2. Lihat PersistentVolume beserta statusnya
kubectl get pv

# 3. Lihat PVC beserta volume yang terpasang dan kapasitasnya
kubectl get pvc web-claim

# 4. Detail lengkap termasuk events saat provisioning atau binding
kubectl describe pvc web-claim`,
      explain: [
        'kubectl get sc menampilkan semua StorageClass klaster; PVC tanpa storageClassName akan otomatis memakai kelas yang ditandai default.',
        'kubectl get pv dan kubectl get pvc memperlihatkan pasangan volume dengan status Bound, Available, atau Released.',
        'kubectl describe pvc menambahkan detail kapasitas terpakai, accessModes, serta pesan events yang sangat membantu ketika PVC berstatus Pending.'
      ]
    },
    {
      type: 'warn',
      title: 'Batas Akses dan hostPath',
      text: 'AccessMode ReadWriteOnce (RWO) berarti volume hanya boleh dipasang pada satu node dalam satu waktu, sehingga Deployment dengan banyak replica lintas node bisa menggantung pada status ContainerWaiting. Selain itu, jangan memakai hostPath untuk data produksi: datanya menempel pada satu node tanpa replikasi, backup, maupun jaminan kelangsungan ketika node tersebut mati.'
    },
    {
      type: 'tip',
      title: 'Cek StorageClass Default',
      text: 'Sebelum menulis PVC, jalankan kubectl get sc untuk memastikan ada StorageClass default di cluster. Kalau tidak ada satu pun, PVC akan berstatus Pending tanpa pesan error yang jelas. Sebaliknya, jika ingin kelas buatanmu menjadi bawaan, tambahkan annotation storageclass.kubernetes.io/is-default-class: "true" pada StorageClass tersebut.'
    },
    {
      type: 'vocab',
      items: [
        ['Volume', 'Direktori yang dipasang ke container untuk membaca atau menulis data.'],
        ['emptyDir', 'Volume sementara yang hidup selama Pod berada di node dan ikut terhapus bersama Pod.'],
        ['PersistentVolume (PV)', 'Objek klaster yang mewakili penyimpanan nyata dengan kapasitas dan accessMode tertentu.'],
        ['PersistentVolumeClaim (PVC)', 'Permintaan pengguna atas kapasitas dan mode akses penyimpanan; diikatkan ke PV yang cocok.'],
        ['StorageClass', 'Definisi provisioner dan parameter yang memungkinkan pembuatan volume otomatis (dynamic provisioning).'],
        ['Access Mode', 'Izin akses volume: ReadWriteOnce, ReadOnlyMany, atau ReadWriteMany.'],
        ['reclaimPolicy', 'Kebijakan nasib data setelah PVC dilepas: Retain (simpan) atau Delete (hapus otomatis).']
      ]
    }
  ],
  recap: [
    'Data di container hilang bersama container; emptyDir bertahan selama Pod hidup tetapi bukan solusi untuk data permanen.',
    'PV menyediakan penyimpanan nyata klaster, PVC mengajukan permintaan, lalu keduanya diikatkan (binding) bila saling cocok.',
    'accessModes menentukan berapa node yang boleh memasang volume, sedangkan reclaimPolicy menentukan data tetap disimpan atau ikut dihapus.',
    'StorageClass dengan provisioner membuat volume secara otomatis; cek kelas default klaster memakai kubectl get sc.'
  ]
});
