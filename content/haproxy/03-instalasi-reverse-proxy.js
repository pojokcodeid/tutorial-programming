/* ============================================================
   Pelajaran HAProxy — 03: Instalasi HAProxy dan Reverse Proxy Pertama
   ============================================================ */
'use strict';

window.HAPROXY_LESSONS = window.HAPROXY_LESSONS || [];

window.HAPROXY_LESSONS.push({
  id: 'instalasi-reverse-proxy',
  title: 'Instalasi HAProxy dan Reverse Proxy Pertama',
  chapter: 'Konfigurasi Dasar',
  duration: '15 menit',
  intro: [
    'Bayangkan kamu memasang pintu otomatis pertama di rumah: sebelum bisa mengatur siapa yang boleh masuk, kamu harus memasangnya dulu, menyambungkan listriknya, dan mencoba membuka-tutup berkali-kali sampai benar-benar lancar. <b>Reverse proxy pertama terasa persis seperti itu</b> — satu backend, satu konfigurasi minimalis, satu pintu yang kamu uji sendiri.',
    'Pelajaran ini menjalankannya dari nol: menyalakan container <code>nginx:alpine</code> sebagai <code>web1</code>, menulis <code>haproxy.cfg</code> yang isinya hanya lima section esensial, menjalankan container HAProxy dengan mount konfigurasi secara read-only, lalu menguji hasilnya lewat <code>curl -i</code> dan <code>podman logs</code>.',
    'Kamu juga belajar kebiasaan operasional yang dipakai sepanjang bab: membaca tabel directive penting, memvalidasi konfigurasi dengan <code>haproxy -c -f</code> sebelum memakainya, dan — yang paling penting — mematikan backend untuk melihat sendiri respons <b>503 Service Unavailable</b> yang akan kamu kejar lagi di pelajaran troubleshooting.'
  ],
  objectives: [
    'Menjalankan container web1 (nginx:alpine) pada network lab dan mengujinya',
    'Menulis haproxy.cfg minimal yang valid: global, defaults, frontend, dan backend',
    'Menjalankan container HAProxy dengan publish port 8080:80 dan mount konfigurasi secara read-only',
    'Menguji reverse proxy dengan curl -i, membaca podman logs, memvalidasi config, dan mengamati 503 saat backend dimatikan'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Urutan yang benar: backend dulu, baru proxy</h3><p>Banyak pemula langsung menulis konfigurasi HAProxy lalu bingung ketika <code>curl</code> gagal — padahal belum ada yang mau menerima request. Urutan lab ini disengaja:</p><ol><li><b>Siapkan backend</b> — container <code>web1</code> berjalan dan menjawab di network <code>haproxy-lab</code>.</li><li><b>Tulis konfigurasi</b> — file <code>haproxy/haproxy.cfg</code> yang meneruskan semua request ke <code>web1</code>.</li><li><b>Jalankan HAProxy</b> — mount konfigurasi itu secara read-only, publish port <code>8080:80</code>.</li><li><b>Uji dan amati</b> — <code>curl -i</code> untuk melihat response lengkap, <code>podman logs</code> untuk melihat sisi proxy.</li></ol><p>Backend tidak perlu dipublikasikan ke host: cukup HAProxy yang membuka port. Inilah salah satu bentuk penyamaran pertama yang kamu dapatkan dari reverse proxy.</p>'
    },
    {
      type: 'example',
      title: 'Langkah 1 — jalankan dan uji backend web1',
      lang: 'bash',
      output: false,
      code: `# di dalam folder haproxy-lab/
podman run -d \\
  --name web1 \\
  --network haproxy-lab \\
  docker.io/library/nginx:alpine

podman ps
podman exec web1 nginx -v
podman inspect web1 --format "{{.State.Status}}"`,
      explain: [
        '<code>-d</code> menjalankan container di belakang layar, <code>--name web1</code> memberi nama yang nanti dipakai sebagai hostname, dan <code>--network haproxy-lab</code> menyatukannya ke jaringan lab buatanmu di pelajaran 01.',
        '<code>podman ps</code> harus menampilkan web1 berstatus <code>Up</code>; <code>podman exec web1 nginx -v</code> membuktikan proses nginx benar-benar berjalan di dalamnya.',
        'Format <code>{{.State.Status}}</code> pada <code>inspect</code> memotong output menjadi satu kata status — cara cepat mengecek container tanpa membanjiri layar.'
      ]
    },
    {
      type: 'example',
      title: 'Langkah 2 — tulis haproxy.cfg minimal',
      lang: 'cfg',
      output: false,
      code: `global
    log stdout format raw local0
    maxconn 2000

defaults
    log global
    mode http
    option httplog
    timeout connect 5s
    timeout client 30s
    timeout server 30s

frontend http_front
    bind :80
    default_backend web_servers

backend web_servers
    server web1 web1:80 check`,
      explain: [
        '<code>global</code>: <code>log stdout format raw local0</code> menulis log ke stdout agar terbaca oleh <code>podman logs</code>, <code>maxconn 2000</code> membatasi koneksi serentak agar lab tidak rakus memori.',
        '<code>defaults</code>: <code>log global</code> mewariskan pengaturan log dari global, <code>mode http</code> menetapkan L7, <code>option httplog</code> membuat tiap request tercatat dalam format HTTP yang mudah dibaca.',
        'Tiga timeout wajib: <code>timeout connect</code> (batas membuka koneksi ke backend), <code>timeout client</code> (batas menunggu client), dan <code>timeout server</code> (batas menunggu backend) — tanpa ini HAProxy menolak konfigurasi.',
        '<code>frontend http_front</code> hanya melakukan dua hal: <code>bind :80</code> mendengarkan port 80 di dalam container, lalu <code>default_backend web_servers</code> menunjuk semua request tanpa aturan khusus ke satu backend itu.',
        '<code>backend web_servers</code> berisi satu baris <code>server web1 web1:80 check</code>: nama server, alamat tujuan memakai nama container di network lab, dan <code>check</code> menyalakan health check bawaan (TCP).'
      ]
    },
    {
      type: 'example',
      title: 'Langkah 3 — jalankan HAProxy, uji dengan curl, baca log',
      lang: 'bash',
      output: false,
      code: `podman run -d \\
  --name haproxy \\
  --network haproxy-lab \\
  -p 8080:80 \\
  -v ./haproxy/haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg:ro \\
  docker.io/library/haproxy:alpine

curl -i http://localhost:8080
podman logs haproxy`,
      explain: [
        '<code>-p 8080:80</code> memetakan port 8080 di host ke port 80 di dalam container HAProxy — client mengakses <code>localhost:8080</code>, HAProxy mendengarkan <code>:80</code> sesuai <code>bind</code>.',
        'Mount <code>-v ./haproxy/haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg:ro</code> menyalin path bawaan image; akhiran <code>:ro</code> membuatnya read-only sehingga kesalahan tulis di dalam container tidak mengubah file aslimu.',
        '<code>curl -i</code> menampilkan header response sekaligus badannya — status <code>200 OK</code> membuktikan request diteruskan utuh ke web1 dan kembali sebagai respons.',
        '<code>podman logs haproxy</code> menampilkan log yang tadi kamu arahkan ke stdout: tiap request tercatat lengkap dengan frontend, backend, server terpilih, status, dan durasi.'
      ]
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Pemetaan port reverse proxy pertama: curl localhost:8080 di host masuk ke container haproxy port 80 yang membaca haproxy.cfg secara read-only, lalu meneruskan ke container web1 port 80 lewat network haproxy-lab">
        <text x="20" y="34" class="u-title" text-anchor="start">Reverse proxy pertama di lab</text>
        <rect x="20" y="112" width="140" height="64" rx="8" class="u-hd"/>
        <text x="90" y="140" class="u-lbl" text-anchor="middle">curl</text>
        <text x="90" y="164" class="u-lbl" text-anchor="middle">localhost:8080</text>
        <line x1="166" y1="144" x2="210" y2="144" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="188" y="130" class="u-lbl" text-anchor="middle">8080</text>
        <rect x="216" y="52" width="252" height="196" rx="10" class="u-box"/>
        <text x="342" y="80" class="u-title" text-anchor="middle">container haproxy</text>
        <rect x="230" y="94" width="224" height="42" rx="6" class="u-hd"/>
        <text x="342" y="121" class="u-lbl" text-anchor="middle">bind :80 (di dalam container)</text>
        <rect x="230" y="146" width="224" height="42" rx="6" class="u-box"/>
        <text x="342" y="173" class="u-lbl" text-anchor="middle">haproxy.cfg (mount ro)</text>
        <rect x="230" y="198" width="224" height="36" rx="6" class="u-box"/>
        <text x="342" y="221" class="u-lbl" text-anchor="middle">default_backend web_servers</text>
        <line x1="474" y1="144" x2="530" y2="144" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="502" y="130" class="u-lbl" text-anchor="middle">web1:80</text>
        <rect x="536" y="112" width="150" height="64" rx="8" class="u-hd"/>
        <text x="611" y="140" class="u-lbl" text-anchor="middle">container web1</text>
        <text x="611" y="164" class="u-lbl" text-anchor="middle">nginx:80</text>
        <text x="380" y="274" class="u-lbl" text-anchor="middle">hanya HAProxy yang membuka port ke host; web1 tetap tersembunyi di network haproxy-lab</text>
      </svg></div><figcaption>Port 8080 di host diteruskan ke port 80 container HAProxy, lalu ke web1 memakai nama container di network lab.</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Tabel directive penting di konfigurasimu</h3><p>Belum perlu menghafal — cukup tahu ke mana mencarinya:</p><table><thead><tr><th>Directive</th><th>Section</th><th>Fungsi</th></tr></thead><tbody><tr><td><code>log stdout format raw local0</code></td><td>global</td><td>Mengirim log ke stdout agar terbaca <code>podman logs</code></td></tr><tr><td><code>maxconn</code></td><td>global</td><td>Batas koneksi serentak</td></tr><tr><td><code>mode http</code></td><td>defaults/frontend/backend</td><td>Menetapkan L7 (atau <code>tcp</code> untuk L4)</td></tr><tr><td><code>option httplog</code></td><td>defaults</td><td>Mencat request dalam format HTTP log</td></tr><tr><td><code>timeout connect/client/server</code></td><td>defaults</td><td>Batas waktu koneksi, tunggu client, tunggu server — wajib ada</td></tr><tr><td><code>bind :80</code></td><td>frontend</td><td>Alamat dan port yang didengarkan</td></tr><tr><td><code>default_backend</code></td><td>frontend</td><td>Backend tujuan bila tidak ada aturan lain</td></tr><tr><td><code>server</code></td><td>backend</td><td>Anggota pool: nama, alamat:port, opsi seperti <code>check</code></td></tr></tbody></table>'
    },
    {
      type: 'example',
      title: 'Langkah 4 — validasi config dan amati 503 saat backend dimatikan',
      lang: 'bash',
      output: false,
      code: `# validasi konfigurasi di dalam container (tanpa restart)
podman exec haproxy haproxy -c -f /usr/local/etc/haproxy/haproxy.cfg

# matikan backend lalu uji respons HAProxy
podman stop web1
curl -i http://localhost:8080

# hidupkan lagi
podman start web1
curl -i http://localhost:8080
podman logs haproxy | tail -20`,
      explain: [
        '<code>haproxy -c -f</code> memeriksa sintaks dan referensi konfigurasi tanpa menjalankannya — pesan <code>Configuration file is valid</code> berarti aman dipakai, dan galat di sini jauh lebih murah daripada HAProxy mati mendadak.',
        'Setelah <code>podman stop web1</code>, HAProxy tetap hidup dan tetap menjawab: karena tidak ada server sehat, ia mengembalikan <b>503 Service Unavailable</b> — persis perilaku yang akan kamu rapikan dengan health check di pelajaran berikutnya.',
        '<code>podman start web1</code> menghidupkan kembali container yang sama (tanpa membuat baru), dan request berikutnya kembali <code>200 OK</code> begitu koneksi ke web1 berhasil.',
        '<code>podman logs haproxy | tail -20</code> menampilkan jejak request terakhir: status 503 tadi tercatat lengkap dengan server yang dicoba, sehingga kamu bisa membedakan &quot;backend mati&quot; dari &quot;HAProxy tidak jalan&quot;.'
      ]
    },
    {
      type: 'warn',
      title: 'Kesalahan umum reverse proxy pertama',
      text: '<ul><li><b>Path mount salah atau tidak dari folder haproxy-lab</b> — container langsung mati dengan <code>config file not found</code>; cek dengan <code>podman logs haproxy</code>.</li><li><b>Lupa <code>--network haproxy-lab</code></b> — HAProxy tidak bisa me-resolve nama <code>web1</code> dan semua request gagal.</li><li><b>Langsung edit config tanpa validasi</b> — jalankan selalu <code>haproxy -c -f</code> dulu; satu typo bisa membuat container tidak start sama sekali.</li><li><b>Mengira 503 berarti HAProxy rusak</b> — 503 justru bukti HAProxy bekerja dan memberi tahu bahwa tidak ada backend sehat.</li><li><b>Memakai angka timeout bawaan tanpa pikir panjang di produksi</b> — nilai di lab ini wajar untuk percobaan, tapi kebutuhan aplikasi nyata harus diukur sendiri.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Ritme aman: validasi, jalankan, uji',
      text: '<p>Biasakan tiga langkah ini setiap kali mengubah <code>haproxy.cfg</code>: <b>(1)</b> <code>podman exec haproxy haproxy -c -f ...</code> untuk validasi, <b>(2)</b> <code>podman restart haproxy</code> bila valid, <b>(3)</b> <code>curl -i</code> untuk membuktikan perilakunya. Ritme kecil ini membuat setiap perubahan konfigurasi terukur dan gampang di-rollback — persis kebiasaan yang kamu perlukan saat nanti mengelola konfigurasi produksi dengan version control.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Reverse proxy', 'Server perantara yang meneruskan request client ke backend dan mengembalikan responsnya.'],
        ['frontend', 'Section titik masuk traffic yang mendefinisikan <code>bind</code> dan tujuan request.'],
        ['backend', 'Section daftar server tujuan beserta algoritma dan health check-nya.'],
        ['bind', 'Directive untuk menentukan alamat dan port yang didengarkan HAProxy.'],
        ['default_backend', 'Backend tujuan otomatis ketika frontend tidak menemukan aturan lain.'],
        ['Mount read-only', 'Pemasangan file host ke container dengan hak baca saja (<code>:ro</code>) agar konfigurasi asli aman.'],
        ['haproxy -c -f', 'Perintah validasi konfigurasi yang memeriksa sintaks tanpa menjalankan proses.'],
        ['503 Service Unavailable', 'Respons yang dikirim HAProxy ketika tidak ada backend sehat untuk melayani request.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Jalankan seluruh empat langkah lab di atas secara berurutan sampai <code>curl -i http://localhost:8080</code> mengembalikan <code>200 OK</code>, lalu tempelkan potongan log dari <code>podman logs haproxy</code> yang menunjukkan request itu.</li><li>Ubah <code>maxconn</code> menjadi <code>100</code>, validasi dengan <code>haproxy -c -f</code>, restart container, dan buktikan HAProxy tetap berjalan.</li><li>Matikan <code>web1</code>, lalu jelaskan dengan kata-katamu <b>mengapa</b> yang muncul 503 dan bukan <code>connection refused</code>, disertai bukti log.</li><li><b>Checkpoint:</b> mampu menjelaskan alur client → HAProxy → backend beserta arti tiap baris pada konfigurasi minimal tersebut.</li></ol>'
    }
  ],
  recap: [
    'Urutan lab yang benar: <b>backend dulu, konfigurasi, jalankan HAProxy, lalu uji</b> — setiap langkah punya bukti yang bisa dicek.',
    '<code>haproxy.cfg</code> minimal punya <b>global, defaults, frontend, backend</b>; tiga timeout di defaults wajib ada agar konfigurasi diterima HAProxy.',
    'Container HAProxy dipublish dengan <b><code>-p 8080:80</code></b> dan mount config <b><code>:ro</code></b>; backend cukup hidup di network lab tanpa dipublikasikan ke host.',
    'Kebiasaan wajib: <b><code>haproxy -c -f</code> sebelum memakai perubahan</b>, dan mematikan backend untuk membuktikan sendiri respons 503.'
  ]
});
