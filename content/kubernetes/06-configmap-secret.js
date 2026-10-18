/* ============================================================
   Pelajaran Kubernetes — Bab 6: ConfigMap & Secret
   ============================================================ */
'use strict';

window.KUBERNETES_LESSONS = window.KUBERNETES_LESSONS || [];

window.KUBERNETES_LESSONS.push({
  id: 'configmap-secret',
  title: 'ConfigMap & Secret',
  chapter: 'Objek Inti',
  duration: '8–10 menit',
  intro: [
    'Suatu ketika aplikasi yang sudah berjalan lancar di development malah gagal konek ke database saat dipindahkan ke staging — hanya karena URL database masih tertanam di dalam image. Setiap kali konfigurasi berubah, image harus dibangun ulang dan rilis menjadi lambat serta berisiko.',
    'Solusinya adalah memisahkan konfigurasi dari image, sesuai prinsip 12-Factor Apps. Kubernetes menyediakan dua objek untuk ini: <b>ConfigMap</b> untuk nilai non-rahasia (URL, nama file, flag) dan <b>Secret</b> untuk data sensitif seperti password, token, dan sertifikat.',
    'Bab ini membahas cara membuat keduanya dari literal maupun berkas, tiga cara memakainya di dalam Pod (env per kunci, envFrom, dan mount sebagai file), serta hal yang perlu diingat soal keamanan dan pembaruan nilai.'
  ],
  objectives: [
    'Memahami prinsip pemisahan konfigurasi dari image (12-factor)',
    'Membuat ConfigMap dan Secret dari literal, berkas, maupun manifest',
    'Memakai konfigurasi sebagai env per kunci, envFrom, atau file hasil mount',
    'Mengetahui batas keamanan base64 dan cara mengamankan data sensitif'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Konfigurasi Terpisah dari Image</h3><p>Prinsip 12-Factor Apps menyarankan konfigurasi seperti URL database, kredensial, dan flag fitur disimpan di lingkungan, bukan di dalam image. Dengan begitu satu image yang sama bisa dipakai di development, staging, dan production tanpa dibangun ulang — hanya konfigurasinya yang berbeda.</p><p>Kubernetes menyediakan dua objek untuk ini: <b>ConfigMap</b> untuk nilai non-rahasia dan <b>Secret</b> untuk data sensitif. Keduanya memiliki struktur serupa (field <code>data</code>) dan bisa dipakai dengan tiga cara:</p><ul><li><b>Env per kunci</b> — melalui <code>valueFrom.configMapKeyRef</code> atau <code>valueFrom.secretKeyRef</code>; cocok untuk nilai tunggal.</li><li><b>envFrom</b> — seluruh kunci dijadikan environment variable sekaligus; praktis bila kuncinya banyak dan namanya valid sebagai env.</li><li><b>Mount sebagai file</b> — lewat volume dan volumeMount; mendukung <code>subPath</code> agar hanya satu berkas yang ditampilkan di dalam pod.</li></ul>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 320" width="760" role="img" aria-label="Alur ConfigMap dan Secret masuk ke Pod melalui environment variable dan volume mount">
        <rect x="30" y="45" width="180" height="64" rx="8" class="u-box"/>
        <text x="120" y="72" class="u-title" text-anchor="middle">ConfigMap app-config</text>
        <text x="120" y="92" class="u-lbl" text-anchor="middle">APP_MODE, APP_PORT</text>
        <rect x="30" y="180" width="180" height="64" rx="8" class="u-box"/>
        <text x="120" y="207" class="u-title" text-anchor="middle">Secret db-credentials</text>
        <text x="120" y="227" class="u-lbl" text-anchor="middle">username, password</text>
        <text x="120" y="268" class="u-lbl" text-anchor="middle">dipakai seperti ConfigMap</text>
        <rect x="300" y="30" width="240" height="250" rx="10" class="u-box"/>
        <text x="420" y="58" class="u-title" text-anchor="middle">Pod aplikasi</text>
        <rect x="315" y="76" width="210" height="80" rx="8" class="u-hd"/>
        <text x="420" y="100" class="u-title" text-anchor="middle">Environment variable</text>
        <text x="420" y="122" class="u-lbl" text-anchor="middle">valueFrom.configMapKeyRef</text>
        <text x="420" y="140" class="u-lbl" text-anchor="middle">envFrom: seluruh kunci</text>
        <rect x="315" y="180" width="210" height="80" rx="8" class="u-box"/>
        <text x="420" y="204" class="u-title" text-anchor="middle">File hasil volume mount</text>
        <text x="420" y="226" class="u-lbl" text-anchor="middle">/etc/config/app.properties</text>
        <text x="420" y="244" class="u-lbl" text-anchor="middle">/etc/secret/credentials</text>
        <line x1="210" y1="68" x2="312" y2="96" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="262" y="56" class="u-lbl" text-anchor="middle">sebagai env</text>
        <line x1="210" y1="100" x2="312" y2="196" class="u-dash" marker-end="url(#u-arrow)"/>
        <text x="238" y="160" class="u-lbl" text-anchor="middle">sebagai file</text>
        <line x1="210" y1="212" x2="312" y2="216" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="261" y="200" class="u-lbl" text-anchor="middle">env &amp; file</text>
        <text x="420" y="305" class="u-lbl" text-anchor="middle">env baru terbaca setelah pod dibuat ulang; file tanpa subPath disegarkan otomatis</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 6.1</b> — ConfigMap dan Secret masuk ke Pod lewat dua jalur: environment variable dan file hasil mount</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Membuat ConfigMap dan Secret dengan kubectl',
      lang: 'bash',
      output: false,
      code: `# ConfigMap: dari literal atau dari satu berkas
kubectl create configmap app-config \\
  --from-literal=APP_MODE=production \\
  --from-literal=APP_PORT=8080
kubectl create configmap app-properties --from-file=app.properties

# Secret generik (jenis Opaque) untuk kredensial
kubectl create secret generic db-credentials \\
  --from-literal=username=appuser \\
  --from-literal=password=s3r3t

# Secret TLS dan secret untuk registry privat
kubectl create secret tls app-tls --cert=tls.crt --key=tls.key
kubectl create secret docker-registry regcred \\
  --docker-server=registry.example.com \\
  --docker-username=ci --docker-password=s3r3t

# Nilai Secret disimpan base64; decoding-nya mudah sekali:
kubectl get secret db-credentials -o jsonpath='{.data.password}' | base64 -d`,
      explain: [
        'Flag --from-literal menambahkan kunci per kunci, sedangkan --from-file memakai nama berkas sebagai nama kunci dan isinya sebagai nilai.',
        'Secret punya beberapa jenis bawaan: Opaque untuk data umum, kubernetes.io/tls untuk sertifikat TLS, dan kubernetes.io/dockerconfigjson untuk kredensial registry container.',
        'Perintah create di atas bersifat sekali jalan; untuk pengelolaan jangka panjang lebih baik simpan manifest hasil --dry-run=client -o yaml lalu terapkan dengan kubectl apply.',
        'Perhatikan baris terakhir: base64 sangat mudah dibalik, jadi Secret bukan tempat aman bila aksesnya tidak dikontrol.'
      ]
    },
    {
      type: 'example',
      title: 'ConfigMap + Secret Dipakai oleh Deployment',
      lang: 'yaml',
      output: false,
      code: `apiVersion: v1
kind: ConfigMap
metadata:
  name: app-properties
data:
  app.properties: |
    app.mode=production
    app.port=8080
    log.level=info
---
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
type: Opaque
data:
  username: YXBwdXNlcg==    # base64 dari "appuser"
  password: czNyM3Q=         # base64 dari "s3r3t"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: app
  template:
    metadata:
      labels:
        app: app
    spec:
      containers:
        - name: app
          image: myrepo/app:1.4.0
          env:                       # env per kunci dari Secret
            - name: DB_USER
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: username
            - name: DB_PASS
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: password
          volumeMounts:              # berkas hasil mount dari ConfigMap
            - name: config
              mountPath: /etc/config/app.properties
              subPath: app.properties   # hanya 1 berkas, bukan seluruh ConfigMap
              readOnly: true
      volumes:
        - name: config
          configMap:
            name: app-properties`,
      explain: [
        'ConfigMap app-properties menyimpan berkas utuh di bawah kunci app.properties; kunci bernama berkas seperti ini tidak valid sebagai env, sehingga paling tepat dipasang lewat volume.',
        'subPath membuat container hanya melihat berkas app.properties di /etc/config, bukan seluruh isi ConfigMap — dan perlu diingat, mount dengan subPath tidak ikut disegarkan otomatis saat ConfigMap berubah.',
        'Secret db-credentials dipakai per kunci melalui secretKeyRef, sehingga nama env (DB_USER, DB_PASS) bisa berbeda dari nama kunci aslinya.',
        'Untuk memakai seluruh kunci sekaligus, ganti field env dengan envFrom berisi configMapRef atau secretRef — pastikan semua kunci bernama seperti variabel env yang sah.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Perilaku Saat Konfigurasi Diubah</h3><p>Perubahan ConfigMap atau Secret <b>tidak otomatis</b> mengubah pod yang sedang berjalan. Nilai environment disalin ketika container pertama kali mulai, sehingga env hanya diperbarui setelah pod dibuat ulang — misalnya dengan <code>kubectl rollout restart deployment/&lt;nama&gt;</code>.</p><p>Berbeda halnya dengan nilai yang di-mount sebagai file: kubelet menyegarkan isi file tersebut secara berkala (sekitar satu menit) tanpa restart pod. Ada satu pengecualian penting — bila mount memakai <code>subPath</code>, berkas tidak ikut disegarkan dan baru berubah setelah pod dibuat ulang. Aplikasi yang membaca konfigurasi dari file penuh bisa memuat ulang konfigurasinya sendiri begitu file berubah, dan bila memakai projected volume, beberapa ConfigMap atau Secret bahkan bisa digabungkan dalam satu volume yang sama.</p>'
    },
    {
      type: 'example',
      title: 'Mengubah Nilai dan Memverifikasi Perubahannya',
      lang: 'bash',
      output: false,
      code: `# Nilai lama masih dipakai oleh pod yang sedang berjalan
kubectl exec deploy/app -- printenv DB_USER        # appuser

# Ubah Secret, lalu paksa pod dibuat ulang agar env ikut berubah
kubectl create secret generic db-credentials \\
  --from-literal=username=appuser --from-literal=password=baru-lagi \\
  --dry-run=client -o yaml | kubectl apply -f -
kubectl rollout restart deployment/app
kubectl rollout status deployment/app
kubectl exec deploy/app -- printenv DB_PASS         # baru-lagi

# Karena mount memakai subPath, berkas ikut baru setelah pod diganti
kubectl exec deploy/app -- cat /etc/config/app.properties`,
      explain: [
        'Pola create --dry-run=client -o yaml lalu pipe ke apply aman dipakai untuk memperbarui Secret, karena nilai baru dibuat ulang dari template yang sama.',
        'kubectl rollout restart memberi anotasi pada pod template sehingga Kubernetes membuat seluruh pod baru dengan nilai env yang terbaru.',
        'Tanpa rollout restart, pod lama terus memakai nilai environment versi lama meskipun ConfigMap atau Secret-nya sudah diperbarui.',
        'Karena volume ini memakai subPath, berkas /etc/config/app.properties tidak disegarkan otomatis dan baru terisi nilai baru setelah pod diganti.',
        'Mount penuh tanpa subPath berbeda: kubelet menyegarkan isinya dalam sekitar satu menit tanpa perlu pembuatan ulang pod.'
      ]
    },
    {
      type: 'tip',
      title: 'File, Bila Aplikasinya Membaca Berkas',
      text: 'Bila aplikasimu membaca konfigurasi dari berkas, mount ConfigMap sebagai file penuh (tanpa subPath) agar perubahan nilai terbaca tanpa restart pod; pakai subPath hanya bila berkas memang harus tetap stabil. Untuk penyimpanan manifest, manfaatkan pola kubectl create ... --dry-run=client -o yaml > configmap.yaml agar struktur manifestnya selalu benar.'
    },
    {
      type: 'warn',
      title: 'Jangan Pernah Commit Credential ke Git',
      text: 'Base64 bukan enkripsi — siapa pun yang bisa membaca Secret tinggal mendecode nilainya. Amankan data sensitif dengan RBAC yang ketat, enkripsi at-rest pada apiserver (EncryptionConfiguration), serta Sealed Secrets atau External Secrets Operator untuk mengelola rahasia berbasis Git tanpa menyimpan nilai mentah di repositori.'
    },
    {
      type: 'vocab',
      items: [
        ['ConfigMap', 'Objek Kubernetes berisi nilai non-rahasia (string) untuk memisahkan konfigurasi dari image.'],
        ['Secret', 'Objek untuk data sensitif, disimpan base64 dan didukung jenis Opaque, TLS, serta dockerconfigjson.'],
        ['Opaque', 'Jenis Secret bawaan untuk data umum berupa pasangan kunci:nilai.'],
        ['envFrom', 'Field pod yang mengekspor seluruh kunci ConfigMap atau Secret sebagai environment variable.'],
        ['subPath', 'Field volumeMount yang menampilkan hanya satu berkas dari ConfigMap atau Secret; mount jenis ini tidak disegarkan otomatis saat isinya berubah.'],
        ['Enkripsi at-rest', 'Fitur apiserver yang mengenkripsi objek (termasuk Secret) saat disimpan di etcd.']
      ]
    }
  ],
  recap: [
    'Konfigurasi dipisah dari image agar satu image sama bisa dipakai di banyak lingkungan; ConfigMap untuk nilai biasa, Secret untuk data sensitif.',
    'ConfigMap dan Secret dibuat dari literal, berkas, atau manifest, lalu dipakai sebagai env per kunci, envFrom, atau file hasil mount.',
    'subPath menampilkan hanya satu berkas (mount dengan subPath tidak disegarkan otomatis); projected volume memungkinkan beberapa ConfigMap/Secret digabung dalam satu volume.',
    'Perubahan env baru terbaca setelah pod dibuat ulang (rollout restart), sedangkan file hasil mount tanpa subPath disegarkan otomatis oleh kubelet; base64 bukan enkripsi — amankan dengan RBAC, enkripsi at-rest, dan Sealed/External Secrets.'
  ]
});
