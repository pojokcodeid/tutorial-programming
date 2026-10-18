/* ============================================================
   Pelajaran Kubernetes — Bab 7: Service & Networking
   ============================================================ */
'use strict';

window.KUBERNETES_LESSONS = window.KUBERNETES_LESSONS || [];

window.KUBERNETES_LESSONS.push({
  id: 'service-networking',
  title: 'Service & Networking',
  chapter: 'Jaringan & Storage',
  duration: '8–10 menit',
  intro: [
    'Kamu baru saja mendeploy aplikasi web dengan tiga replica Pod dan semuanya berjalan lancar. Masalah muncul ketika aplikasi lain mencoba memanggilnya: tiap Pod punya IP address berbeda, dan IP itu bisa berubah kapan saja saat Pod direstart atau berpindah node. Kira-kira alamat apa yang harus dipanggil para klien itu?',
    'Di Kubernetes, jawabannya adalah objek <b>Service</b>: sebuah alamat virtual (VIP) beserta nama DNS yang stabil di balik kumpulan Pod yang sementara (ephemeral). Klien cukup menghubungi Service, dan Service meneruskan permintaan ke salah satu Pod yang sehat di belakangnya.',
    'Bab ini membahas model jaringan Kubernetes, keempat tipe Service, cara menghubungkan Service ke Pod melalui selector dan Endpoints, serta strategi mengakses layanan dari dalam maupun luar cluster.'
  ],
  objectives: [
    'Memahami model jaringan Kubernetes: IP per Pod dan komunikasi tanpa NAT',
    'Mengenali empat tipe Service: ClusterIP, NodePort, LoadBalancer, dan ExternalName',
    'Menghubungkan Service ke Pod melalui selector dan objek Endpoints',
    'Tahu cara mengakses layanan dari dalam cluster dan dari luar cluster'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Model Jaringan Kubernetes</h3><p>Kubernetes menerapkan model jaringan <b>flat</b>: setiap Pod mendapatkan IP address sendiri, dan setiap Pod dapat berkomunikasi dengan Pod lain tanpa Network Address Translation (NAT) apa pun, termasuk lintas node. Artinya sebuah Pod benar-benar bisa langsung menjangkau Pod lain memakai alamat IP pod tersebut.</p><p>Agar pola ini tetap rapi, Kubernetes menetapkan beberapa aturan: semua container di dalam satu Pod berbagi satu jaringan sehingga saling terjangkau lewat localhost, port yang didengarkan container dideklarasikan lewat <code>containerPort</code>, dan <b>kube-proxy</b> berjalan di setiap node untuk memasang aturan iptables/IPVS yang mengarahkan trafik layanan ke Pod yang benar. Karena IP Pod berubah tiap kali Pod dibuat ulang, diperlukan lapisan dengan alamat tetap — di situlah peran Service.</p>'
    },
    {
      type: 'example',
      title: 'Service Tipe ClusterIP (Bawaan)',
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
        - name: web
          image: docker.io/nginxinc/nginx-unprivileged:1.27
          ports:
            - containerPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: web-service
spec:
  type: ClusterIP          # tipe bawaan, boleh dihilangkan
  selector:
    app: web               # harus cocok dengan label Pod
  ports:
    - name: http
      port: 8080           # port virtual di dalam cluster
      targetPort: 8080     # port yang benar-benar didengarkan container
      protocol: TCP`,
      explain: [
        'Deployment membuat tiga Pod berlabel app: web; tiap Pod memakai image nginx non-root yang mendengarkan port 8080 sehingga tetap selaras dengan pola rootless Podman.',
        'Service web-service memiliki IP virtual tetap (misalnya 10.96.10.20) yang tidak berubah walau Pod dibuat ulang berkali-kali.',
        'Field selector berperan sebagai pengikat: semua Pod dengan label app: web otomatis menjadi backend Service ini.',
        'Di dalam cluster klien cukup memanggil http://web-service:8080; DNS cluster menerjemahkan nama itu ke IP virtual Service.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Empat Tipe Service</h3><p>Tipe Service menentukan seberapa luas layananmu bisa diakses:</p><ul><li><b>ClusterIP</b> (bawaan) – hanya dapat diakses dari dalam cluster. Pilihan tepat untuk komunikasi antar layanan internal.</li><li><b>NodePort</b> – membuka port tetap pada rentang <b>30000–32767</b> di setiap node, sehingga trafik luar yang menuju &lt;IP-node&gt;:&lt;nodePort&gt; diteruskan ke Service.</li><li><b>LoadBalancer</b> – meminta IP eksternal kepada load balancer cloud; di cluster lokal biasanya berstatus Pending kecuali kamu memasang MetalLB.</li><li><b>ExternalName</b> – bukan untuk Pod, melainkan memetakan nama Service ke domain eksternal lewat record DNS CNAME.</li></ul>'
    },
    {
      type: 'example',
      title: 'Service Tipe NodePort',
      lang: 'yaml',
      output: false,
      code: `apiVersion: v1
kind: Service
metadata:
  name: web-nodeport
spec:
  type: NodePort
  selector:
    app: web               # reuse Deployment web dari contoh sebelumnya
  ports:
    - name: http
      port: 8080
      targetPort: 8080
      nodePort: 30080      # wajib berada di rentang 30000-32767`,
      explain: [
        'Saat tipe diubah ke NodePort, tetap dibuat IP virtual ClusterIP internal, ditambah port 30080 yang dibuka kube-proxy di setiap node.',
        'kubectl get svc web-nodeport akan menampilkan kolom PORT(S) berupa 30080:30210 yang artinya nodePort 30080 diteruskan ke port Service 30210.',
        'Kamu bisa membiarkan nodePort kosong dan biarkan Kubernetes memilihkan nomor gratis, atau menentukannya sendiri bila ada kebutuhan firewall.',
        'Di Minikube, perintah minikube service web-nodeport --url memberi URL yang langsung bisa dibuka dari browser host.'
      ]
    },
    {
      type: 'text',
      html: `<h3>Selector, Endpoints, dan Alur Request</h3><p>Service tidak menyimpan IP Pod secara manual. Ia hanya membawa <b>selector</b>, sedangkan daftar backend yang hidup disimpan pada objek <b>Endpoints</b> (pada klaster baru juga tersedia EndpointSlice). Setiap kali Pod dibuat, dihentikan, atau lolos pemeriksaan kesehatan, daftar Endpoints ikut diperbarui otomatis oleh endpoint controller.</p><figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 340" width="760" role="img" aria-label="Alur request dari klien ke Service, lalu Endpoints, dan akhirnya ke Pod di dua node berbeda">
        <rect x="20" y="150" width="130" height="64" rx="8" class="u-box"/>
        <text x="85" y="176" class="u-title">Klien</text>
        <text x="85" y="196" class="u-lbl" text-anchor="middle">Pod / CLI lain</text>
        <line x1="152" y1="182" x2="196" y2="182" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="174" y="172" class="u-lbl" text-anchor="middle">DNS</text>
        <rect x="200" y="138" width="150" height="88" rx="8" class="u-hd"/>
        <text x="275" y="164" class="u-title">Service</text>
        <text x="275" y="184" class="u-lbl" text-anchor="middle">web-service</text>
        <text x="275" y="202" class="u-lbl" text-anchor="middle">VIP 10.96.0.12</text>
        <text x="275" y="220" class="u-sub" text-anchor="middle">port 8080</text>
        <text x="275" y="256" class="u-lbl" text-anchor="middle">aturan iptables/IPVS oleh kube-proxy</text>
        <line x1="352" y1="182" x2="396" y2="182" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="374" y="172" class="u-lbl" text-anchor="middle">pilih</text>
        <rect x="400" y="138" width="150" height="88" rx="8" class="u-box"/>
        <text x="475" y="164" class="u-title">Endpoints</text>
        <text x="475" y="188" class="u-lbl" text-anchor="middle">10.244.0.5:8080</text>
        <text x="475" y="208" class="u-lbl" text-anchor="middle">10.244.1.7:8080</text>
        <line x1="552" y1="160" x2="596" y2="96" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="552" y1="204" x2="596" y2="270" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="600" y="34" width="140" height="116" rx="8" class="u-box"/>
        <text x="670" y="56" class="u-sub" text-anchor="middle">Node 1</text>
        <rect x="614" y="70" width="112" height="64" rx="6" class="u-hd"/>
        <text x="670" y="96" class="u-title">Pod A</text>
        <text x="670" y="118" class="u-lbl" text-anchor="middle">10.244.0.5</text>
        <rect x="600" y="214" width="140" height="116" rx="8" class="u-box"/>
        <text x="670" y="236" class="u-sub" text-anchor="middle">Node 2</text>
        <rect x="614" y="250" width="112" height="64" rx="6" class="u-hd"/>
        <text x="670" y="276" class="u-title">Pod B</text>
        <text x="670" y="298" class="u-lbl" text-anchor="middle">10.244.1.7</text>
        <text x="20" y="332" class="u-lbl">Service menyediakan VIP tetap; Endpoints memetakannya ke IP Pod yang selalu berubah</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 7.1</b> — Permintaan mengalir: klien → Service (VIP) → Endpoints → Pod di node mana pun</figcaption></figure><h3>Pola Akses</h3><p>Dari dalam cluster, klien cukup memakai nama Service karena CoreDNS menerjemahkannya ke IP virtual, misalnya <code>http://web-service:8080</code>. Bentuk DNS yang lengkap adalah <code>&lt;svc&gt;.&lt;ns&gt;.svc.cluster.local</code>, misalnya <code>web-service.default.svc.cluster.local</code>; tanpa awalan namespace, DNS mengasumsikan namespace yang sama.</p><ul><li><b>Dalam cluster</b>: nama Service saja, contoh http://web-service:8080.</li><li><b>Luar cluster</b>: via NodePort, via LoadBalancer, atau via kubectl port-forward untuk kebutuhan development.</li></ul>`
    },
    {
      type: 'example',
      title: 'Verifikasi Service dan Akses dari Luar Pod',
      lang: 'bash',
      output: false,
      code: `# 1. Lihat Service beserta IP virtual dan port node-nya
kubectl get svc web-service

# 2. Lihat Pod mana yang sedang menjadi backend (kolom ENDPOINTS)
kubectl get endpoints web-service

# 3. Uji resolusi nama Service dari dalam cluster
kubectl run tmp --rm -it --restart=Never \\
  --image=docker.io/curlimages/curl -- \\
  curl -s http://web-service:8080

# 4. Teruskan port Service ke mesin lokal (khusus development)
kubectl port-forward svc/web-service 8080:8080`,
      explain: [
        'Perintah get endpoints menampilkan daftar IP:port Pod yang saat ini menjadi backend; kolom ENDPOINTS berisi None adalah tanda paling umum bahwa selector tidak cocok dengan label Pod mana pun.',
        'Uji akses memakai pod sementara curlimages/curl membuktikan resolusi DNS nama Service berfungsi tanpa perlu membuka port apa pun ke luar.',
        'kubectl port-forward meneruskan port lokal 8080 ke port Service 8080 sehingga aplikasi bisa diuji dari browser atau Postman di mesin development.'
      ]
    },
    {
      type: 'tip',
      title: 'Port-Forward untuk Development',
      text: 'kubectl port-forward svc/web-service 8080:8080 sangat nyaman saat mengembangkan aplikasi, tetapi jangan dipakai di produksi: koneksi hanya hidup selama sesi terminal berjalan, tidak melayani banyak klien sekaligus, dan tidak melakukan load balancing. Di Minikube, alternatif yang lebih mendekati kondisi nyata adalah memperoleh URL NodePort dengan perintah minikube service web-service --url.'
    },
    {
      type: 'warn',
      title: 'Perhatian Batas Tipe Service',
      text: 'NodePort membuka port pada rentang 30000–32767 di setiap node dan mengeksposnya ke jaringan luar, sedangkan LoadBalancer langsung meminta IP eksternal dari provider cloud sehingga di cluster lokal (Minikube/Kind) biasanya tetap berstatus Pending tanpa MetalLB. Untuk komunikasi internal antar layanan, cukup pakai ClusterIP agar permintaanmu tidak terbuka sembarangan.'
    },
    {
      type: 'vocab',
      items: [
        ['Service', 'Objek yang menyediakan IP virtual dan nama DNS stabil untuk sekumpulan Pod yang sementara.'],
        ['Selector', 'Kumpulan label pada Service yang dipakai untuk mencocokkan Pod backend.'],
        ['Endpoints', 'Objek yang menyimpan daftar IP dan port Pod yang sedang menjadi backend sebuah Service.'],
        ['ClusterIP', 'Tipe Service bawaan yang hanya dapat diakses dari dalam cluster.'],
        ['NodePort', 'Tipe Service yang membuka port tetap pada rentang 30000–32767 di setiap node.'],
        ['LoadBalancer', 'Tipe Service yang meminta IP eksternal dari load balancer cloud atau MetalLB.'],
        ['CoreDNS', 'Layanan DNS bawaan klaster yang menerjemahkan nama Service menjadi IP virtual.']
      ]
    }
  ],
  recap: [
    'Setiap Pod punya IP sendiri dan semua Pod dapat saling menjangkau tanpa NAT; yang sementara adalah IP Pod, bukan nama Service.',
    'Service menyediakan VIP dan nama DNS stabil; selector dan Endpoints mengikatnya ke Pod backend secara otomatis.',
    'ClusterIP untuk internal, NodePort (30000–32767) untuk ekspos ringan, LoadBalancer untuk IP eksternal, dan ExternalName untuk mengarah ke domain luar.',
    'Dari dalam cluster akses memakai nama Service seperti http://web-service:8080; dari luar pakai NodePort, LoadBalancer, atau port-forward saat development.'
  ]
});
