/* ============================================================
   Pelajaran Kubernetes — Bab 12: Namespace, RBAC & Keamanan Pod
   ============================================================ */
'use strict';

window.KUBERNETES_LESSONS = window.KUBERNETES_LESSONS || [];

window.KUBERNETES_LESSONS.push({
  id: 'keamanan-rbac',
  title: 'Namespace, RBAC & Keamanan Pod',
  chapter: 'Keamanan',
  duration: '10–12 menit',
  intro: [
    'Pernahkah kamu bertanya-tanya apa yang terjadi bila sebuah pod dapat membaca Secret milik tim lain, atau bila satu tim menghabiskan seluruh kapasitas cluster sehingga namespace lain ikut tersendat? Pada cluster produksi, keterbukaan seperti ini bukan sekadar kerepotan — ia adalah celah keamanan sekaligus risiko ketersediaan.',
    'Kubernetes menyediakan tiga lapis pengaman yang saling melengkapi. <b>Namespace</b> memisahkan objek secara logis dan menjadi dasar pembagian batas sumber daya lewat ResourceQuota dan LimitRange. <b>RBAC</b> menentukan siapa (manusia maupun pod) boleh melakukan apa terhadap sumber daya cluster. <b>NetworkPolicy</b> dan <b>Pod Security Standards</b> membatasi lalu lintas antar pod serta mencegah kontainer berjalan dengan hak istimewa berlebih.',
    'Pada bab ini kamu akan membuat namespace beserta kuotanya, mengenal ServiceAccount sebagai identitas pod, menulis Role dan RoleBinding, memeriksa izin dengan kubectl auth can-i, memasang NetworkPolicy, serta mengerasasi pod dengan securityContext dan Pod Security Standards.'
  ],
  objectives: [
    'Membuat namespace, ResourceQuota, dan LimitRange untuk isolasi logis antar tim',
    'Memahami ServiceAccount sebagai identitas pod yang memanggil API server',
    'Menulis Role, RoleBinding, serta memahami perbedaannya dengan ClusterRole dan ClusterRoleBinding',
    'Mengonfigurasi NetworkPolicy dan mengerasasi pod dengan securityContext serta Pod Security Standards'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Namespaces: Isolasi Logis dalam Satu Cluster</h3><p><b>Namespace</b> membagi satu cluster menjadi beberapa ruang logis, misalnya dev, staging, dan produksi, atau per tim seperti tim-payment dan tim-catalog. Setiap objek — pod, service, configmap, secret — hidup di satu namespace, dan namanya hanya perlu unik di dalam namespace itu.</p><ul><li><code>kubectl create ns dev</code> membuat namespace baru.</li><li><code>kubectl config set-context --current --namespace=dev</code> mengubah namespace aktif sehingga kamu tidak perlu menulis <code>-n dev</code> pada setiap perintah.</li><li>Hampir semua perintah mendukung <code>-n</code> (singkatan dari <code>--namespace</code>), misalnya <code>kubectl get pods -n dev</code>.</li><li>Alternatif praktis: tool <code>kubens</code> dari paket kubectx untuk berpindah namespace dengan cepat.</li></ul><h3>ResourceQuota &amp; LimitRange</h3><p><b>ResourceQuota</b> membatasi total pemakaian sebuah namespace: jumlah pod, total CPU dan memory untuk requests maupun limits, jumlah PersistentVolumeClaim, dan lainnya. Tanpa kuota, satu tim dapat menghabiskan seluruh kapasitas cluster dan membuat namespace lain ikut menderita.</p><p><b>LimitRange</b> menetapkan default requests dan limits per container. Pod yang lupa menulis field <code>resources</code> tetap mendapat angka bawaan, sekaligus mencegah pod tanpa batas masuk ke cluster produksi.</p>'
    },
    {
      type: 'example',
      title: 'Namespace dengan Kuota dan Batas Bawaan',
      lang: 'bash',
      output: false,
      code: `# Buat namespace dan jadikan aktif
kubectl create ns dev
kubectl config set-context --current --namespace=dev

# Batasi total pemakaian namespace (ResourceQuota)
kubectl create quota dev-quota --hard=cpu=2,memory=4Gi,pods=20

# Default requests dan limits per container (LimitRange)
kubectl create limitrange dev-limits --default=cpu=200m,default-memory=256Mi --default-requests-cpu=50m,default-requests-memory=64Mi

# Periksa keduanya
kubectl get resourcequota,limitrange`,
      explain: [
        'Perintah <code>set-context</code> mengubah namespace aktif pada konfigurasi kubectl; alternatif praktisnya adalah tool kubens.',
        'ResourceQuota membatasi total 2 inti CPU, 4Gi memory, dan maksimal 20 pod, sedangkan LimitRange memberi default requests dan limits pada container yang tidak menuliskannya sehingga pod tetap lolos pemeriksaan kuota.'
      ]
    },
    {
      type: 'text',
      html: `<h3>ServiceAccount: Identitas Pod</h3><p>Pod tidak memakai akun manusia. Sebagai gantinya, setiap pod diasosiasikan dengan <b>ServiceAccount</b> — identitas yang dipakai ketika pod memanggil API server, misalnya untuk mengambil ConfigMap atau Secret. Buat dengan <code>kubectl create sa app-sa -n dev</code>, lalu isi <code>serviceAccountName: app-sa</code> pada spec pod.</p><h3>RBAC: Siapa Boleh Apa</h3><p><b>RBAC</b> (Role-Based Access Control) memisahkan dua hal: <b>subjek</b> yang meminta izin dan <b>peran</b> yang mendefinisikan aksi yang boleh dilakukan.</p><ul><li><b>Subjects</b> — User, Group, dan ServiceAccount.</li><li><b>Role</b> — daftar aturan berupa resource dan verbs yang berlaku di <b>satu namespace</b>. <b>ClusterRole</b> adalah versi lintas cluster, contohnya peran bawaan <code>view</code>, <code>edit</code>, <code>admin</code>, dan <code>cluster-admin</code>.</li><li><b>Binding</b> — <b>RoleBinding</b> mengikat peran ke subjek dalam satu namespace, sedangkan <b>ClusterRoleBinding</b> mengikatnya untuk seluruh cluster.</li></ul><p>Setiap aturan menyebut resource (pods, secrets, deployments) dan verbs: <code>get</code>, <code>list</code>, <code>watch</code>, <code>create</code>, <code>update</code>, <code>patch</code>, dan <code>delete</code>. Periksa izin sebuah identitas dengan <code>kubectl auth can-i create pods --as=system:serviceaccount:dev:app-sa -n dev</code>; flag <code>--as</code> memungkinkan kamu mengecek sebagai subjek lain tanpa harus login sebagai subjek itu.</p>
        <figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 330" width="760" role="img" aria-label="Diagram RBAC: subjek User, Group, dan ServiceAccount diikat oleh RoleBinding ke Role atau ClusterRole yang menentukan akses ke sumber daya">
          <text x="380" y="30" class="u-sub" text-anchor="middle">RBAC: Subjek diikat ke Peran, Peran Menentukan Akses</text>
          <rect x="20" y="60" width="160" height="200" rx="10" class="u-box"/>
          <text x="100" y="88" class="u-title" text-anchor="middle">Subjects</text>
          <rect x="35" y="104" width="130" height="38" rx="6" class="u-hd"/>
          <text x="100" y="128" class="u-title" text-anchor="middle">User</text>
          <rect x="35" y="152" width="130" height="38" rx="6" class="u-hd"/>
          <text x="100" y="176" class="u-title" text-anchor="middle">Group</text>
          <rect x="35" y="200" width="130" height="38" rx="6" class="u-hd"/>
          <text x="100" y="224" class="u-title" text-anchor="middle">ServiceAccount</text>
          <line x1="180" y1="160" x2="236" y2="160" class="u-line" marker-end="url(#u-arrow)"/>
          <text x="208" y="150" class="u-lbl" text-anchor="middle">bind</text>
          <rect x="240" y="110" width="140" height="100" rx="8" class="u-hd"/>
          <text x="310" y="140" class="u-title" text-anchor="middle">Binding</text>
          <text x="310" y="164" class="u-lbl" text-anchor="middle">RoleBinding (1 ns)</text>
          <text x="310" y="188" class="u-lbl" text-anchor="middle">ClusterRoleBinding</text>
          <line x1="380" y1="160" x2="436" y2="160" class="u-line" marker-end="url(#u-arrow)"/>
          <text x="408" y="150" class="u-lbl" text-anchor="middle">aturan</text>
          <rect x="440" y="110" width="150" height="100" rx="8" class="u-box"/>
          <text x="515" y="138" class="u-title" text-anchor="middle">Role / ClusterRole</text>
          <text x="515" y="162" class="u-lbl" text-anchor="middle">verbs: get, list, create,</text>
          <text x="515" y="184" class="u-lbl" text-anchor="middle">update, patch, delete, watch</text>
          <line x1="590" y1="160" x2="636" y2="160" class="u-line" marker-end="url(#u-arrow)"/>
          <text x="613" y="150" class="u-lbl" text-anchor="middle">ke</text>
          <rect x="640" y="90" width="100" height="140" rx="8" class="u-box"/>
          <text x="690" y="118" class="u-title" text-anchor="middle">Resources</text>
          <text x="690" y="142" class="u-lbl" text-anchor="middle">pods</text>
          <text x="690" y="162" class="u-lbl" text-anchor="middle">secrets</text>
          <text x="690" y="184" class="u-lbl" text-anchor="middle">configmaps</text>
          <text x="380" y="290" class="u-lbl" text-anchor="middle">Tanpa Binding, sebuah Role tidak memberi izin apa pun kepada subjek</text>
        </svg></div><figcaption class="fig-cap"><b>Gambar 12.1</b> — Alur RBAC: subjek diikat lewat binding ke peran yang mendefinisikan akses ke sumber daya</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'ServiceAccount, Role, dan RoleBinding',
      lang: 'yaml',
      output: false,
      code: `apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-sa
  namespace: dev
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: app-role
  namespace: dev
rules:
  - apiGroups: [""]
    resources: ["configmaps", "secrets"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["apps"]
    resources: ["deployments"]
    verbs: ["get", "list", "update", "patch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: app-rolebinding
  namespace: dev
subjects:
  - kind: ServiceAccount
    name: app-sa
    namespace: dev
roleRef:
  kind: Role
  name: app-role
  apiGroup: rbac.authorization.k8s.io`,
      explain: [
        'Dokumen pertama membuat ServiceAccount app-sa sebagai identitas pod di namespace dev; manifest pod perlu mengisi <code>serviceAccountName: app-sa</code>.',
        'Role app-role hanya memberi izin baca configmaps dan secrets serta update deployments di namespace dev; RoleBinding mengikatnya ke ServiceAccount app-sa, dan tanpa binding itu Role tidak memberi izin apa pun.',
        'Uji hasilnya: <code>kubectl auth can-i get secrets --as=system:serviceaccount:dev:app-sa -n dev</code> menjawab yes, sedangkan versi delete menjawab no.'
      ]
    },
    {
      type: 'text',
      html: '<h3>NetworkPolicy: Firewall Antar Pod</h3><p>Secara bawaan semua pod di cluster saling bisa dijangkau tanpa filter apa pun. <b>NetworkPolicy</b> menambahkan aturan lalu lintas untuk pod terpilih: <code>podSelector</code> memilih pod yang diatur, <code>policyTypes</code> menyebut arah yang diatur (Ingress, Egress, atau keduanya), <code>ingress.from</code> menyebut sumber yang boleh masuk (podSelector dan/atau namespaceSelector), dan <code>egress.to</code> menyebut tujuan yang boleh dihubungi, misalnya DNS di namespace kube-system.</p><p>Dua syarat penting. Pertama, NetworkPolicy hanya efektif bila CNI plugin cluster mendukungnya, misalnya Calico, Cilium, atau OVN-Kubernetes; pada cluster tanpa dukungan itu, policy diterima API server tetapi tidak pernah diterapkan pada jaringan. Kedua, begitu sebuah pod dipilih oleh minimal satu policy, semua trafik yang tidak diizinkan oleh policy mana pun menjadi tertutup.</p><h3>Pod Security Standards &amp; Hardening Pod</h3><p>Kubernetes bawaan menyediakan <b>Pod Security Admission</b> dengan tiga tingkat: <b>privileged</b> tanpa batas, <b>baseline</b> yang melarang konfigurasi berisiko tinggi, dan <b>restricted</b> yang menerapkan praktik terbaik. Tingkat diaktifkan per namespace lewat label <code>pod-security.kubernetes.io/enforce</code>, misalnya <code>kubectl label ns dev pod-security.kubernetes.io/enforce=restricted</code>. Tersedia pula label tingkat audit dan warn untuk mencatat pelanggaran tanpa memblokir pod.</p><p>Pengerasan pod yang umum: <code>runAsNonRoot: true</code>, <code>runAsUser</code> bernilai bukan nol, <code>readOnlyRootFilesystem: true</code>, <code>allowPrivilegeEscalation: false</code>, <code>capabilities.drop: [ALL]</code>, dan <code>seccompProfile.type: RuntimeDefault</code>. Seluruhnya sejalan dengan filosofi Podman rootless: proses kontainer berjalan sebagai pengguna biasa tanpa hak istimewa, sehingga kebocoran di dalam kontainer tidak langsung menjadi kebocoran di level host.</p>'
    },
    {
      type: 'example',
      title: 'NetworkPolicy dan Pod Terifikasi (Hardening)',
      lang: 'yaml',
      output: false,
      code: `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: db-policy
  namespace: dev
spec:
  podSelector:
    matchLabels:
      app: db
  policyTypes: ["Ingress", "Egress"]
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: api
      ports:
        - protocol: TCP
          port: 5432
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: kube-system
      ports:
        - protocol: UDP
          port: 53
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: dev
spec:
  replicas: 2
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 65532
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: api
          image: myapp-api:1.0
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: ["ALL"]`,
      explain: [
        'Policy db-policy hanya memilih pod berlabel app: db di namespace dev sehingga pod lain tidak terpengaruh.',
        'Ingress hanya mengizinkan pod berlabel app: api pada port 5432, dan egress hanya mengizinkan DNS ke namespace kube-system.',
        'Label kubernetes.io/metadata.name ditambahkan otomatis pada setiap namespace, sehingga namespaceSelector dapat langsung dipakai.',
        'Dokumen kedua memperlihatkan pengerasan pod; aplikasi yang menulis file ke disk perlu menambahkan emptyDir pada path tersebut.'
      ]
    },
    {
      type: 'tip',
      title: 'Audit Izin Secara Berkala',
      text: 'Gunakan <code>kubectl auth can-i --list --as=system:serviceaccount:dev:app-sa -n dev</code> untuk melihat seluruh izin sebuah ServiceAccount dalam satu layar. Sebelum memasang <code>enforce: restricted</code>, aktifkan dulu mode audit dan warn pada namespace produksi agar pod yang melanggar teridentifikasi tanpa memblokir deployment.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'ClusterRoleBinding memberi izin luas karena berlaku untuk seluruh cluster, termasuk semua namespace yang dibuat nanti. Berikan hanya bila memang perlu lintas namespace; untuk kebanyakan aplikasi, Role dan RoleBinding di namespace sendiri sudah cukup. Contoh berbahaya: mengikat peran cluster-admin ke ServiceAccount bawaan pod, yang membuat satu celah di dalam pod menjadi kendali penuh atas cluster.'
    },
    {
      type: 'vocab',
      items: [
        ['Namespace', 'Pembatas logis yang memisahkan objek cluster menjadi ruang per tim atau per lingkungan.'],
        ['ResourceQuota', 'Batas total pemakaian sumber daya sebuah namespace, seperti jumlah pod, CPU, dan memory.'],
        ['LimitRange', 'Aturan default requests dan limits per container di dalam sebuah namespace.'],
        ['ServiceAccount', 'Identitas yang dipakai pod ketika memanggil API server.'],
        ['RoleBinding', 'Objek yang mengikat Role atau ClusterRole ke subjek pada satu namespace.'],
        ['NetworkPolicy', 'Aturan firewall antar pod untuk trafik ingress dan egress; efektif bila CNI mendukung.'],
        ['Pod Security Standards', 'Tingkat keamanan privileged, baseline, dan restricted yang diterapkan per namespace lewat label admission.']
      ]
    }
  ],
  recap: [
    'Namespace memisahkan objek secara logis; ResourceQuota membatasi total pemakaian dan LimitRange memberi default requests/limits per container.',
    'ServiceAccount adalah identitas pod; RBAC mengikat subjek ke peran lewat RoleBinding untuk satu namespace atau ClusterRoleBinding untuk seluruh cluster.',
    'NetworkPolicy hanya efektif bila CNI mendukung, dan menutup semua trafik yang tidak diizinkan setelah sebuah pod dipilih sebuah policy.',
    'Pod Security Standards privileged, baseline, dan restricted diterapkan per namespace lewat label pod-security.kubernetes.io/enforce, dilengkapi pengerasan securityContext pada pod.'
  ]
});
