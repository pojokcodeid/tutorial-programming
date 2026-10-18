/* ============================================================
   Pelajaran Kubernetes — Bab 8: Ingress & Manajemen TLS
   ============================================================ */
'use strict';

window.KUBERNETES_LESSONS = window.KUBERNETES_LESSONS || [];

window.KUBERNETES_LESSONS.push({
  id: 'ingress-tls',
  title: 'Ingress & Manajemen TLS',
  chapter: 'Jaringan & Storage',
  duration: '8–10 menit',
  intro: [
    'Aplikasimu kini punya dua layanan: web pada port 8080 dan API pada port 3000, masing-masing dengan Service sendiri. Semua berjalan lancar sampai klien meminta HTTPS, lalu path /api pada host yang sama, dan setiap layanan tampaknya butuh port terbuka sendiri-sendiri. Service ternyata tidak dirancang untuk pekerjaan sebesar itu.',
    '<b>Ingress</b> adalah objek Kubernetes yang menjadi lapisan routing HTTP/HTTPS di depan banyak Service sekaligus. Ingress memahami konsep host, path, dan sertifikat TLS, lalu meneruskan request ke Service yang tepat berdasarkan aturan yang kamu tulis dalam satu manifest.',
    'Bab ini membahas cara kerja Ingress beserta Ingress Controller yang wajib ada di baliknya, pola routing berbasis host dan path, pemasangan TLS lewat Secret, serta otomatisasi sertifikat dengan cert-manager.'
  ],
  objectives: [
    'Memahami keterbatasan Service dan alasan kebutuhan Ingress',
    'Tahu bahwa Ingress hanya bekerja bila ada Ingress Controller di cluster',
    'Mendefinisikan routing berbasis host dan path untuk beberapa layanan',
    'Mengamankan trafik dengan TLS Secret dan cert-manager Let\'s Encrypt'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Ketika Service Tidak Lagi Cukup</h3><p>Service memang andal mengarahkan trafik ke Pod, tetapi kemampuannya terbatas: satu Service menangani satu port, dan ia sama sekali tidak memahami isi trafik HTTP — tidak tahu host yang diminta, path URL yang sedang diakses, maupun header-nya. Akibatnya, ketika aplikasi tumbuh menjadi banyak layanan, kamu harus menyediakan satu Service (dan seringnya satu port NodePort atau LoadBalancer) per layanan, lengkap dengan konfigurasi TLS yang diurus manual di setiap titik.</p><p>Keterbatasan inilah yang dijawab oleh objek <b>Ingress</b>.</p><h3>Ingress dan Ingress Controller</h3><p>Ingress adalah objek API pada grup <code>networking.k8s.io/v1</code> yang mendeskripsikan aturan routing HTTP/HTTPS: host mana yang dilayani, bagian path apa yang dikenali, dan Service tujuan beserta portnya. Satu objek Ingress bisa melayani banyak layanan sekaligus, termasuk mengurus sertifikat TLS.</p><p><b>PENTING:</b> Ingress hanyalah sebuah deskripsi aturan. Objek ini <b>tidak akan berfungsi apa pun</b> selama cluster tidak memiliki <b>Ingress Controller</b> yang membacanya dan menerapkannya sebagai konfigurasi router sungguhan. Implementasi yang paling umum adalah NGINX Ingress Controller dan Traefik. Di Minikube kamu bisa mengaktifkannya dengan <code>minikube addons enable ingress</code>, sedangkan di Kind kamu harus memasangnya sendiri, misalnya lewat Helm chart resminya.</p>'
    },
    {
      type: 'example',
      title: 'Ingress dengan Routing Berbasis Path dan Host',
      lang: 'yaml',
      output: false,
      code: `apiVersion: v1
kind: Service
metadata:
  name: web-service
spec:
  selector:
    app: web
  ports:
    - port: 8080
      targetPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: api-service
spec:
  selector:
    app: api
  ports:
    - port: 8080
      targetPort: 8080
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - app.example.com
        - api.example.com
      secretName: app-tls
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: api-service
                port:
                  number: 8080
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web-service
                port:
                  number: 8080
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api-service
                port:
                  number: 8080`,
      explain: [
        'Dua Service sederhana mengarahkan trafik ke Pod berlabel app: web dan app: api; objek Deployment-nya tidak ditulis di sini agar fokus tetap pada Ingress.',
        'Blok rules memperlihatkan kedua gaya routing sekaligus: berbasis path (app.example.com/api dilayani api-service, sedangkan sisanya ke web-service) dan berbasis host (api.example.com seluruhnya dilayani api-service).',
        'Urutan path penting; Kubernetes mencocokkan path paling spesifik lebih dahulu, sehingga /api harus didefinisikan sebelum /.',
        'Field ingressClassName memilih Ingress Controller yang akan memproses objek ini, sedangkan blok tls menunjuk Secret app-tls yang akan dibuat pada bagian manajemen TLS.'
      ]
    },
    {
      type: 'text',
      html: `<h3>Alur Request Melalui Ingress</h3><p>Browser mengirim request ke alamat host aplikasi. Request diterima lebih dahulu oleh Ingress Controller (biasanya berupa Pod dengan Service dan IP sendiri), yang mencocokkan host dan path terhadap objek Ingress, lalu meneruskannya ke Service tujuan beserta Pod di belakangnya.</p><figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 330" width="760" role="img" aria-label="Alur request dari browser ke Ingress Controller lalu ke dua Service dan Pod masing-masing">
        <rect x="20" y="120" width="140" height="72" rx="8" class="u-box"/>
        <text x="90" y="146" class="u-title">Browser</text>
        <text x="90" y="164" class="u-lbl" text-anchor="middle">app.example.com</text>
        <text x="90" y="182" class="u-lbl" text-anchor="middle">api.example.com</text>
        <line x1="162" y1="156" x2="198" y2="156" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="202" y="46" width="180" height="220" rx="8" class="u-box"/>
        <text x="292" y="72" class="u-title">Ingress Controller</text>
        <text x="292" y="92" class="u-lbl" text-anchor="middle">NGINX / Traefik</text>
        <line x1="216" y1="104" x2="368" y2="104" class="u-line"/>
        <rect x="216" y="118" width="152" height="64" rx="6" class="u-hd"/>
        <text x="292" y="144" class="u-title">Ingress</text>
        <text x="292" y="166" class="u-lbl" text-anchor="middle">aturan host &amp; path</text>
        <text x="292" y="212" class="u-lbl" text-anchor="middle">terminate TLS</text>
        <text x="292" y="236" class="u-lbl" text-anchor="middle">cocokkan rules</text>
        <line x1="384" y1="140" x2="434" y2="108" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="409" y="118" class="u-lbl" text-anchor="middle">path /</text>
        <line x1="384" y1="176" x2="434" y2="232" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="409" y="206" class="u-lbl" text-anchor="middle">path /api</text>
        <rect x="438" y="72" width="132" height="64" rx="8" class="u-box"/><text x="504" y="98" class="u-title">web-service</text>
        <text x="504" y="120" class="u-lbl" text-anchor="middle">ClusterIP :8080</text>
        <rect x="438" y="208" width="132" height="64" rx="8" class="u-box"/><text x="504" y="234" class="u-title">api-service</text>
        <text x="504" y="256" class="u-lbl" text-anchor="middle">ClusterIP :8080</text>
        <line x1="572" y1="104" x2="616" y2="104" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="572" y1="240" x2="616" y2="240" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="620" y="56" width="120" height="96" rx="8" class="u-hd"/><text x="680" y="84" class="u-title">Pods web</text>
        <text x="680" y="108" class="u-lbl" text-anchor="middle">2 replica</text>
        <text x="680" y="128" class="u-lbl" text-anchor="middle">10.244.0.x</text>
        <rect x="620" y="192" width="120" height="96" rx="8" class="u-hd"/><text x="680" y="220" class="u-title">Pods api</text>
        <text x="680" y="244" class="u-lbl" text-anchor="middle">2 replica</text>
        <text x="680" y="264" class="u-lbl" text-anchor="middle">10.244.1.x</text>
        <text x="20" y="312" class="u-lbl">Satu Ingress mengurus banyak host/path sekaligus menggantikan banyak port NodePort</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 8.1</b> — Ingress Controller memilah request berdasarkan host dan path, lalu meneruskannya ke Service yang tepat</figcaption></figure><h3>Annotation Populer untuk NGINX</h3><ul><li><code>nginx.ingress.kubernetes.io/rewrite-target: /</code> – memangkas bagian path tertentu sebelum diteruskan ke Service, misalnya /api/users menjadi /users; untuk pola multi-path sering dipadukan dengan pathType ImplementationSpecific berbasis regex.</li><li><code>nginx.ingress.kubernetes.io/proxy-body-size: 16m</code> – mengangkat batas ukuran unggahan yang bawaan controller dibatasi 1 MB.</li><li><code>kubernetes.io/ingress.class: nginx</code> – cara lama memilih controller; sekarang lebih disarankan memakai field spec.ingressClassName seperti pada contoh manifest.</li></ul>`
    },
    {
      type: 'text',
      html: '<h3>HTTPS dengan TLS Secret</h3><p>Agar Ingress menyajikan HTTPS, tersedia Secret bawaan bertipe <code>kubernetes.io/tls</code> yang berisi dua key: <code>tls.crt</code> (sertifikat) dan <code>tls.key</code> (private key). Secret ini lalu dirujuk dari blok <code>tls</code> pada Ingress melalui field <code>secretName</code>, sedangkan <code>tls[].hosts</code> mencantumkan nama host yang dilayani sertifikat tersebut.</p><ul><li>Secret harus berada di namespace yang sama dengan Ingress yang merujuknya.</li><li>Path pada Ingress tidak boleh memakai wildcard; penggunaan host wildcard seperti *.example.com hanya berlaku pada controller dan sertifikat tertentu.</li><li>Kamu dapat membuat Secret secara manual dengan kubectl create secret tls, atau membiarkan cert-manager menerbitkan sertifikat secara otomatis.</li></ul>'
    },
    {
      type: 'example',
      title: 'ClusterIssuer Let\'s Encrypt untuk cert-manager',
      lang: 'yaml',
      output: false,
      code: `apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@example.com
    privateKeySecretRef:
      name: letsencrypt-prod-account
    solvers:
      - http01:
          ingress:
            class: nginx`,
      explain: [
        'ClusterIssuer mendefinisikan penerbit sertifikat yang berlaku untuk seluruh cluster, berbeda dengan Issuer yang hanya berlaku di satu namespace.',
        'Blok acme menunjuk server resmi penerbit sertifikat gratis Let\'s Encrypt; untuk uji coba gunakan alamat staging https://acme-staging-v02.api.letsencrypt.org/directory agar tidak kena pembatasan jumlah penerbitan.',
        'Solver http01 membuktikan kepemilikan domain dengan membuat jalur khusus melalui Ingress Controller, sehingga controller harus sudah berjalan sebelumnya.',
        'Setelah ClusterIssuer siap, tambahkan annotation cert-manager.io/cluster-issuer: letsencrypt-prod pada Ingress seperti pada contoh manifest sebelumnya, dan sertifikat akan diterbitkan serta diperbarui otomatis.'
      ]
    },
    {
      type: 'example',
      title: 'Pemasangan cert-manager dan Secret TLS Manual',
      lang: 'bash',
      output: false,
      code: `# 1. Pasang cert-manager lewat Helm (CRD disertakan)
helm repo add jetstack https://charts.jetstack.io
helm repo update
helm install cert-manager jetstack/cert-manager \\
  --namespace cert-manager --create-namespace \\
  --set crds.enabled=true
# 2. Pastikan semua pod cert-manager sudah Running
kubectl get pods -n cert-manager
# 3. Alternatif tanpa cert-manager: buat Secret dari sertifikat milikmu
kubectl create secret tls app-tls \\
  --cert=fullchain.pem --key=privkey.pem
# 4. Pantau penerbitan sertifikat oleh cert-manager
kubectl get certificate,orders,challenges`,
      explain: [
        'cert-manager dipasang sekali di level cluster; setelah itu ia bisa menerbitkan dan memperbarui sertifikat Let\'s Encrypt untuk semua Ingress yang kamu buat.',
        'Urutan helm repo add, helm repo update, lalu helm install memastikan kamu memakai chart resmi jetstack lengkap dengan CRD cert-manager-nya.',
        'Jika sudah memiliki sertifikat dari pihak lain, cukup buat Secret dengan kubectl create secret tls dan langsung rujuk dari field secretName pada Ingress.',
        'Perintah terakhir menampilkan Status dan Ready seluruh Certificate; bila muncul Error, periksa detailnya dengan kubectl describe certificate.'
      ]
    },
    {
      type: 'warn',
      title: 'Ingress Hanya untuk HTTP(S)',
      text: 'Ingress hanya melayani trafik HTTP dan HTTPS karena ia bekerja pada lapisan aplikasi. Protokol lain seperti TCP, UDP, maupun gRPC non-HTTP tetap harus diekspos lewat Service bertipe NodePort atau LoadBalancer — mengarahkan protokol tersebut ke Ingress tidak akan pernah bekerja.'
    },
    {
      type: 'tip',
      title: 'Menguji Host Ingress Secara Lokal',
      text: 'Saat pengembangan lokal, tambahkan entri di file /etc/hosts yang menunjuk IP cluster (di Minikube peroleh dengan perintah minikube ip) ke nama host aplikasi, misalnya 192.168.49.2 app.example.com. Setelah itu https://app.example.com bisa diuji langsung dari browser tanpa membeli domain sungguhan, dan aturan host pada Ingress benar-benar teruji.'
    },
    {
      type: 'vocab',
      items: [
        ['Ingress', 'Objek networking.k8s.io/v1 yang mendeskripsikan aturan routing HTTP/HTTPS untuk banyak Service.'],
        ['Ingress Controller', 'Perangkat lunak seperti NGINX Ingress atau Traefik yang membaca objek Ingress dan menerapkannya sebagai router sungguhan.'],
        ['Routing berbasis path', 'Pola routing yang membedakan layanan dari bagian path URL, misalnya /api dan /.'],
        ['Routing berbasis host', 'Pola routing yang membedakan layanan dari nama domain yang diminta klien.'],
        ['TLS Secret', 'Secret bertipe kubernetes.io/tls yang berisi tls.crt dan tls.key untuk menyajikan HTTPS.'],
        ['cert-manager', 'Operator yang menerbitkan dan memperbarui sertifikat TLS secara otomatis melalui protokol ACME.'],
        ['ACME', 'Protokol penerbitan sertifikat (misalnya Let\'s Encrypt) yang memverifikasi kepemilikan domain sebelum menerbitkan sertifikat.']
      ]
    }
  ],
  recap: [
    'Ingress menambahkan routing berdasarkan host dan path untuk HTTP/HTTPS di atas banyak Service sekaligus.',
    'Objek Ingress baru bekerja bila ada Ingress Controller seperti NGINX atau Traefik yang berjalan di cluster; di Minikube aktifkan lewat minikube addons enable ingress.',
    'TLS dipasang lewat Secret kubernetes.io/tls yang dirujuk dari tls[].secretName, dengan daftar nama domain di tls[].hosts.',
    'cert-manager mempercepat penerbitan sertifikat Let\'s Encrypt secara otomatis memakai ClusterIssuer dan annotation cert-manager.io/cluster-issuer.'
  ]
});
