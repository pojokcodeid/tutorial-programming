/* ============================================================
   Pelajaran Elasticsearch — 02: Menjalankan Elasticsearch dengan Podman
   (Roadmap Level 1 — bab Fondasi)
   ============================================================ */
'use strict';

window.ELASTICSEARCH_LESSONS = window.ELASTICSEARCH_LESSONS || [];

window.ELASTICSEARCH_LESSONS.push({
  id: 'setup-elasticsearch-podman',
  title: 'Menjalankan Elasticsearch dengan Podman',
  chapter: 'Fondasi',
  duration: '15 menit',
  intro: [
    'Bayangkan kamu ingin berlatih berenang, tapi kolamnya belum diisi air. Semua teori gaya bebas akan terasa percuma sampai kamu masuk ke air dan merasakan tarikannya. Pelajaran ini adalah proses mengisi kolam itu: <b>menyalakan Elasticsearch pertama kamu lewat Podman</b>, lengkap dengan Kibana, volume penyimpanan, dan health check supaya labnya siap dipakai berulang sampai capstone.',
    'Kamu akan menulis satu file <code>compose.yaml</code> yang mendefinisikan dua layanan — Elasticsearch 8.17.0 dan Kibana 8.17.0 dengan versi yang sama — lalu menjalankannya dengan <code>podman compose up -d</code>. Setelah itu kamu membuktikan cluster-nya hidup lewat <code>curl</code>, membaca <code>_cluster/health</code>, dan mengintip daftar node lewat <code>_nodes</code>.',
    'Pelajaran ini juga melatih siklus hidup container: start, stop, restart, baca logs, hapus container tanpa menghapus volume, sampai menghapus volume untuk melihat data hilang. Semua itu bekal harianmu sepanjang bab ini — kalau lab ini rapi di awal, kamu tidak akan tersandung &quot;port sudah dipakai&quot; atau &quot;data hilang&quot; di tengah materi berat.'
  ],
  objectives: [
    'Menyiapkan direktori lab dan menulis <code>compose.yaml</code> single-node dengan versi gambar yang sama (8.17.0)',
    'Menjalankan Elasticsearch + Kibana lewat <code>podman compose up -d</code> dan memverifikasi lewat <code>curl</code> serta health check',
    'Membaca status cluster, node, dan logs sebagai kebiasaan diagnosis pertama',
    'Menguasai siklus hidup container beserta persistent volume: data tetap ada saat container dihapus, hilang saat volume dihapus'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Kenapa satu file compose cukup untuk seluruh bab?</h3><p>Bayangkan lab sebagai sebuah bangunan yang harus kamu dirikan ulang setiap kali komputer menyala. Kalau setiap kali mengetik puluhan perintah <code>podman run</code>, kamu akan cepat lelah dan salah ketik. <code>compose.yaml</code> adalah <b>denah bangunan itu</b>: begitu tertulis, siapa pun (termasuk kamu tiga minggu lagi) bisa mendirikan lab yang persis sama dengan satu perintah.</p><p>Tiga keputusan penting di dalamnya:</p><table><thead><tr><th>Keputusan</th><th>Nilai di lab</th><th>Alasan</th></tr></thead><tbody><tr><td><code>discovery.type</code></td><td><code>single-node</code></td><td>Cluster satu node tanpa proses pemilihan master — paling sederhana untuk belajar</td></tr><tr><td><code>xpack.security.enabled</code></td><td><code>false</code></td><td>Memudahkan pemula mencoba API tanpa credential; <b>khusus lab</b></td></tr><tr><td><code>ES_JAVA_OPTS</code></td><td><code>-Xms1g -Xmx1g</code></td><td>Membatasi heap JVM agar tidak melahap seluruh RAM mesinmu</td></tr></tbody></table><p>Perhatikan juga dua baris penting lainnya: gambar Elasticsearch dan Kibana memakai <b>tag versi yang sama</b>, dan ada <code>healthcheck</code> yang mengecek endpoint tiap 15 detik. Kibana baru dinyalakan setelah Elasticsearch sehat (<code>condition: service_healthy</code>), sehingga kamu tidak melihat layar merah Kibana yang masih menunggu.</p>'
    },
    {
      type: 'example',
      title: 'compose.yaml: Elasticsearch + Kibana single-node',
      lang: 'cfg',
      output: false,
      code: `services:
  elasticsearch:
    image: docker.io/library/elasticsearch:8.17.0
    container_name: elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - ES_JAVA_OPTS=-Xms1g -Xmx1g
    ports:
      - "9200:9200"
    volumes:
      - esdata:/usr/share/elasticsearch/data
    networks:
      - elastic-lab
    healthcheck:
      test: ["CMD-SHELL", "curl -fsS http://localhost:9200 >/dev/null || exit 1"]
      interval: 15s
      timeout: 5s
      retries: 10

  kibana:
    image: docker.io/library/kibana:8.17.0
    container_name: kibana
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    ports:
      - "5601:5601"
    depends_on:
      elasticsearch:
        condition: service_healthy
    networks:
      - elastic-lab

volumes:
  esdata:

networks:
  elastic-lab:`,
      explain: [
        '<code>image</code> memakai tag <code>8.17.0</code> untuk kedua layanan — tag versi yang sama membuat lab reproducible; hindari <code>latest</code> karena isinya bisa berubah tanpa kamu sadari.',
        '<code>discovery.type=single-node</code> memberi tahu Elasticsearch bahwa ini cluster satu node, jadi tidak perlu konfigurasi seed host; <code>xpack.security.enabled=false</code> menonaktifkan autentikasi agar kamu fokus belajar API.',
        '<code>ES_JAVA_OPTS=-Xms1g -Xmx1g</code> mengunci heap JVM di 1 GB — awal dan maksimum sama agar JVM tidak bolak-balik membesar-mengecilkan memori.',
        'Volume bernama <code>esdata</code> dipetakan ke <code>/usr/share/elasticsearch/data</code>, dan healthcheck memakai <code>curl -fsS</code> ke port 9200 — inilah yang membuat <code>depends_on</code> pada Kibana bisa menunggu Elasticsearch benar-benar siap.'
      ]
    },
    {
      type: 'example',
      title: 'Jalankan lab dan buktikan cluster-nya hidup',
      lang: 'bash',
      output: false,
      code: `mkdir -p elasticsearch-lab/data
cd elasticsearch-lab
# taruh compose.yaml di folder ini, lalu:
podman compose up -d

# periksa container
podman ps

# tunggu sehat lalu tes endpoint
curl http://localhost:9200
curl "http://localhost:9200/_cluster/health?pretty"
curl "http://localhost:9200/_nodes?pretty" | head -30`,
      explain: [
        '<code>podman compose up -d</code> menarik gambar (unduh pertama kali), membuat network, membuat volume, lalu menjalankan kedua layanan di background — <code>-d</code> berarti detached, terminal tetap bisa dipakai.',
        '<code>podman ps</code> menampilkan container berstatus <code>running</code> beserta port <code>9200</code> dan <code>5601</code>; kalau ada yang kosong, periksa logs dengan <code>podman compose logs</code>.',
        'Respons <code>curl http://localhost:9200</code> memuat <code>cluster_name</code>, <code>cluster_uuid</code>, dan <code>tagline: &quot;You Know, for Search&quot;</code> — tagline itulah tanda klasik bahwa Elasticsearch menjawab.',
        '<code>_cluster/health</code> mengembalikan <code>status</code> (green/yellow/red) dan jumlah shard; <code>_nodes</code> menampilkan node beserta versi, role, dan penggunaan memorinya — dua endpoint ini akan kamu pakai sepanjang bab.'
      ]
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Arsitektur lab Elasticsearch: folder elasticsearch-lab berisi compose.yaml yang menjalankan container elasticsearch di port 9200 dan kibana di port 5601, terhubung lewat network elastic-lab dengan volume esdata untuk penyimpanan">
        <text x="30" y="34" class="u-title" text-anchor="start">Folder lab: elasticsearch-lab/</text>
        <rect x="30" y="54" width="320" height="196" rx="10" class="u-box"/>
        <rect x="46" y="76" width="288" height="40" rx="6" class="u-hd"/>
        <text x="190" y="102" class="u-lbl" text-anchor="middle">compose.yaml</text>
        <rect x="46" y="126" width="288" height="40" rx="6" class="u-box"/>
        <text x="190" y="152" class="u-lbl" text-anchor="middle">data/ (opsional, untuk file lab)</text>
        <rect x="46" y="176" width="288" height="40" rx="6" class="u-box"/>
        <text x="190" y="202" class="u-lbl" text-anchor="middle">volume esdata (data index)</text>
        <line x1="356" y1="150" x2="404" y2="150" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="380" y="138" class="u-lbl" text-anchor="middle">up -d</text>
        <rect x="410" y="54" width="322" height="196" rx="10" class="u-box"/>
        <text x="571" y="82" class="u-title" text-anchor="middle">Network: elastic-lab</text>
        <rect x="428" y="98" width="286" height="52" rx="6" class="u-hd"/>
        <text x="571" y="122" class="u-lbl" text-anchor="middle">container elasticsearch</text>
        <text x="571" y="142" class="u-lbl" text-anchor="middle">port 9200 host</text>
        <rect x="428" y="164" width="136" height="52" rx="6" class="u-box"/>
        <text x="496" y="188" class="u-lbl" text-anchor="middle">kibana</text>
        <text x="496" y="208" class="u-lbl" text-anchor="middle">:5601</text>
        <rect x="578" y="164" width="136" height="52" rx="6" class="u-box"/>
        <text x="646" y="188" class="u-lbl" text-anchor="middle">curl / Kibana UI</text>
        <text x="646" y="208" class="u-lbl" text-anchor="middle">dari host</text>
        <text x="410" y="276" class="u-lbl" text-anchor="start">Kibana menunggu healthcheck Elasticsearch sehat sebelum dinyalakan</text>
      </svg></div><figcaption>Satu <code>compose.yaml</code> mendirikan dua layanan pada network yang sama; data index hidup di volume <code>esdata</code>, bukan di dalam container.</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Siklus hidup container dan membaca logs',
      lang: 'bash',
      output: false,
      code: `# status dan logs
podman ps
podman compose logs -f elasticsearch
podman inspect elasticsearch | head -40

# hentikan dan nyalakan kembali
podman compose stop
podman compose start

# restart (paling sering dipakai saat konfigurasi berubah)
podman compose restart

# perintah yang akan dipakai berulang di seluruh bab
podman stats
podman compose down`,
      explain: [
        '<code>logs -f</code> mengikuti log secara langsung; di dalamnya kamu akan melihat pesan startup Elasticsearch hingga baris <code>started</code> yang menandai node siap melayani request.',
        '<code>inspect</code> menampilkan detail JSON: IP network, environment variable, state, dan path volume — alat pertama saat kamu bingung &quot;kenapa port tidak terbuka&quot;.',
        'Perbedaan penting: <code>stop</code> menghentikan container (masih bisa <code>start</code>), <code>down</code> menghapus container dan network tetapi <b>volume tetap ada</b>, sedangkan <code>podman stats</code> menampilkan pemakaian CPU/memori real-time container yang sedang jalan.',
        '<code>podman stats</code> berguna memantau Elasticsearch saat kamu menambah data nanti — lihat apakah pemakaian memori mendekati heap 1 GB yang kamu atur.'
      ]
    },
    {
      type: 'example',
      title: 'Bukti persistent volume: data bertahan saat container dihapus',
      lang: 'bash',
      output: false,
      code: `# isi satu dokumen sebagai penanda
curl -s -X POST "http://localhost:9200/products/_doc?pretty" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Laptop Penanda", "price": 1000000}'

# hapus container TANPA menghapus volume
podman compose down
podman volume ls

# jalankan lagi, lalu cek dokumen tadi masih ada
podman compose up -d
curl "http://localhost:9200/products/_doc/1?pretty"

# HATI-HATI: langkah berikut menghapus data (pakai data dummy saja)
podman volume rm elasticsearch-lab_esdata`,
      explain: [
        'Dokumen yang kamu buat tersimpan di dalam volume <code>esdata</code>, bukan di lapisan container — karena itu setelah <code>down</code> lalu <code>up -d</code> kembali, dokumen tetap bisa diambil.',
        '<code>podman volume ls</code> menampilkan volume yang masih ada; nama volume memakai pola <code>&lt;nama-folder&gt;_&lt;nama-volume&gt;</code> sehingga kamu tahu volume milik lab mana.',
        'Perintah terakhir menghapus volume — gunakan hanya pada data dummy sebagai eksperimen melihat data benar-benar hilang; inilah alasan roadmap menekankan backup di pelajaran tersendiri.',
        'Kebiasaan baik: sebelum menghapus apa pun, tanyakan dulu &quot;di mana data saya disimpan?&quot; — untuk Elasticsearch, jawabannya ada di <code>/usr/share/elasticsearch/data</code> di dalam volume.'
      ]
    },
    {
      type: 'warn',
      title: 'Kesalahan umum saat setup lab',
      text: '<ul><li><b>Memakai tag <code>latest</code></b> — gambar bisa berubah versi dan merusak reproducibility; tetap pada <code>8.17.0</code> untuk lab ini.</li><li><b>Elasticsearch langsung mati saat start</b> — paling sering karena memori kurang; cek <code>podman logs elasticsearch</code> dan turunkan <code>ES_JAVA_OPTS</code> ke <code>-Xms512m -Xmx512m</code>.</li><li><b>Kibana menampilkan status belum terhubung</b> — Elasticsearch belum sehat; tunggu health check hijau dengan <code>podman compose ps</code> sebelum membuka Kibana.</li><li><b>Port 9200 atau 5601 sudah dipakai</b> — proses lama masih hidup; periksa dengan <code>podman ps -a</code> lalu hentikan, atau ganti port publik jadi <code>9201:9200</code>.</li><li><b>Menjalankan perintah dari folder yang salah</b> — <code>podman compose</code> mencari <code>compose.yaml</code> di direktori kerja; pastikan kamu berada di <code>elasticsearch-lab/</code>.</li><li><b>Menganggap security boleh nonaktif di mana saja</b> — pengaturan ini hanya aman untuk lab lokal; pelajaran keamanan akan mengaktifkannya kembali.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Tunggu benar-benar sehat, bukan sekadar container running',
      text: '<p>Status <code>running</code> pada <code>podman ps</code> hanya berarti prosesnya hidup — Elasticsearch masih memuat index dan menyiapkan cluster state. Biasakan menunggu health check dengan <code>podman compose ps</code> (kolom <code>healthy</code>) sebelum mengirim request pertama, atau ulangi <code>curl http://localhost:9200</code> sampai menjawab. Kebiasaan kecil ini menghemat banyak waktu debugging &quot;connection refused&quot; yang sebenarnya hanya butuh beberapa detik kesabaran.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Container', 'Proses yang menjalankan aplikasi dari image, terisolasi dari host; dihapus tanpa mempengaruhi data di volume.'],
        ['Image', 'Cetakan berisi Elasticsearch/Kibana beserta dependensinya; ditarik dari registry dengan tag versi.'],
        ['Compose', 'Cara mendefinisikan banyak layanan, volume, dan network dalam satu file <code>compose.yaml</code> lalu menjalankannya bersamaan.'],
        ['Volume', 'Penyimpanan permanen milik container runtime; di lab ini menampung seluruh data index Elasticsearch.'],
        ['Network', 'Jaringan khusus agar container saling menemukan lewat nama (misal <code>elasticsearch</code>), bukan IP.'],
        ['Health check', 'Pemeriksaan berkala yang menandai layanan sehat atau sakit; di lab memakai <code>curl</code> ke port 9200.'],
        ['Single-node', 'Mode cluster satu node untuk pengembangan; tanpa pemilihan master dan tanpa replica node.'],
        ['Heap JVM', 'Memori yang dialokasikan untuk mesin virtual Java tempat Elasticsearch berjalan; diatur lewat <code>ES_JAVA_OPTS</code>.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Jalankan lab dari awal dengan <code>podman compose up -d</code>, lalu buktikan tiga hal: <code>curl http://localhost:9200</code> menjawab, <code>_cluster/health</code> menampilkan status, dan Kibana terbuka di port 5601.</li><li>Lakukan siklus <b>stop → start → restart</b> sambil mengamati <code>podman ps</code> dan logs; catat perbedaan perilakunya.</li><li>Buat satu dokumen penanda, hapus container dengan <code>podman compose down</code>, jalankan ulang, lalu buktikan data masih ada. Setelah itu hapus volume dan amati data hilang (gunakan data dummy saja).</li><li><b>Checkpoint:</b> mampu menjalankan Elasticsearch + Kibana dengan satu perintah, membaca health dan logs, serta menjelaskan di mana data disimpan dan kapan data itu hilang.</li></ol>'
    }
  ],
  recap: [
    'Satu <code>compose.yaml</code> adalah denah lab: <b>single-node, security nonaktif, heap 1 GB, health check</b>, dan tag versi sama (8.17.0) untuk Elasticsearch dan Kibana.',
    'Verifikasi bertahap: <code>podman compose ps</code> (sehat), <code>curl /</code> (menjawab), <code>_cluster/health</code> (status), <code>_nodes</code> (detail node).',
    'Siklus hidup: <code>stop/start/restart</code> mengelola container, <code>down</code> menghapus container &amp; network, tetapi <b>volume <code>esdata</code> tetap bertahan</b>.',
    'Data hilang hanya saat volume dihapus — karena itu backup dan restore dibahas serius di pelajaran operasional, bukan sebagai pikiran belakangan.'
  ]
});
