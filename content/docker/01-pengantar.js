/* ============================================================
   Pelajaran Docker — Bab 1: Pengantar Container & Docker (L1)
   ============================================================ */
'use strict';

window.DOCKER_LESSONS = window.DOCKER_LESSONS || [];

window.DOCKER_LESSONS.push({
  id: 'pengantar-container-docker',
  title: 'Pengantar Container & Docker',
  chapter: 'Pengenalan',
  duration: '8–10 menit',
  intro: [
    'Pernah mengalami aplikasimu berjalan lancar di laptop sendiri, tetapi malah error saat dipindahkan ke server? Masalah klasik ini muncul karena <b>perbedaan lingkungan</b>: versi library, konfigurasi sistem, atau dependensi yang tidak sama.',
    '<b>Containerization</b> adalah cara mengemas aplikasi beserta seluruh dependensinya (library, runtime, konfigurasi) ke dalam satu paket yang terisolasi, sehingga aplikasi dapat berjalan <b>konsisten di mana saja</b> — di laptop, server, maupun cloud.',
    '<b>Docker</b> adalah platform containerization yang paling populer saat ini. Docker membuat proses pengemasan aplikasi (containerizing) menjadi jauh lebih mudah dan terstandar dibandingkan solusi sebelumnya.'
  ],
  objectives: [
    'Memahami apa itu container dan bedanya dengan Virtual Machine (VM)',
    'Memahami peran Image, Container, dan Registry',
    'Mengetahui arsitektur dasar Docker (Daemon, Client, REST API)',
    'Memahami manfaat Docker untuk pengembangan & deployment'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Apa itu Container?</h3><p>Container adalah lingkungan eksekusi yang terisolasi untuk menjalankan sebuah aplikasi. Di dalamnya tersedia ruang sendiri untuk filesystem, jaringan, dan proses, sehingga aplikasi di dalam container tidak saling mengganggu aplikasi lain.</p><p>Berbeda dengan Virtual Machine (VM) yang menjalankan <b>Guest OS</b> penuh untuk setiap mesin virtual, container <b>memanfaatkan kernel dari Host OS</b> melalui container runtime (Docker). Karena tidak perlu menggandakan sistem operasi utuh, container menjadi jauh lebih ringan, sangat cepat dijalankan (hitungan detik), dan dapat diskalakan dalam jumlah besar.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 330" width="760" role="img" aria-label="Perbandingan tumpukan Virtual Machine dan Container">
        <text x="190" y="34" class="u-sub" text-anchor="middle">Virtual Machine</text>
        <text x="570" y="34" class="u-sub" text-anchor="middle">Container</text>
        <rect x="60" y="104" width="126" height="46" rx="6" class="u-box"/>
        <text x="123" y="126" class="u-title">App A</text>
        <text x="123" y="144" class="u-lbl" text-anchor="middle">app + libraries</text>
        <rect x="194" y="104" width="126" height="46" rx="6" class="u-box"/>
        <text x="257" y="126" class="u-title">App B</text>
        <text x="257" y="144" class="u-lbl" text-anchor="middle">app + libraries</text>
        <rect x="60" y="156" width="126" height="46" rx="6" class="u-hd"/>
        <text x="123" y="184" class="u-title">Guest OS A</text>
        <rect x="194" y="156" width="126" height="46" rx="6" class="u-hd"/>
        <text x="257" y="184" class="u-title">Guest OS B</text>
        <rect x="60" y="208" width="260" height="36" rx="6" class="u-box"/>
        <text x="190" y="231" class="u-title">Hypervisor</text>
        <rect x="60" y="250" width="260" height="36" rx="6" class="u-box"/>
        <text x="190" y="273" class="u-title">Hardware</text>
        <rect x="440" y="104" width="126" height="46" rx="6" class="u-box"/>
        <text x="503" y="126" class="u-title">App A</text>
        <text x="503" y="144" class="u-lbl" text-anchor="middle">app + libraries</text>
        <rect x="574" y="104" width="126" height="46" rx="6" class="u-box"/>
        <text x="637" y="126" class="u-title">App B</text>
        <text x="637" y="144" class="u-lbl" text-anchor="middle">app + libraries</text>
        <rect x="440" y="166" width="260" height="36" rx="6" class="u-hd"/>
        <text x="570" y="189" class="u-title">Container Runtime (Docker)</text>
        <rect x="440" y="208" width="260" height="36" rx="6" class="u-box"/>
        <text x="570" y="231" class="u-title">Host OS + Kernel</text>
        <rect x="440" y="250" width="260" height="36" rx="6" class="u-box"/>
        <text x="570" y="273" class="u-title">Hardware</text>
        <text x="60" y="312" class="u-lbl">Tiap VM bawa Guest OS sendiri → berat &amp; boot lama</text>
        <text x="440" y="312" class="u-lbl">Semua container berbagi 1 kernel host → ringan &amp; cepat</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 1.1</b> — VM menggandakan OS utuh; container hanya menggandakan aplikasinya</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Perbedaan VM vs Container (Konsep)',
      lang: 'text',
      output: false,
      code: `VM: Aplikasi + Guest OS + Hypervisor + Host OS + Hardware
Container: Aplikasi + Dependencies + Container Runtime (Docker) + Host OS + Hardware`,
      explain: [
        'VM memvirtualisasi seluruh mesin, termasuk sistem operasi lengkap sehingga berat dan lambat start.',
        'Container memvirtualisasi sistem operasi host dan hanya membawa aplikasi beserta dependensinya, sehingga berbagi satu kernel yang sama.',
        'Hasilnya container jauh lebih ringan dan waktu startup turun dari menit (VM) menjadi hitungan detik (container).'
      ]
    },
    {
      type: 'text',
      html: '<h3>Konsep Dasar Docker</h3><p>Ada 3 konsep fundamental yang wajib kamu pahami sejak awal, karena semua perintah Docker berputar di ketiganya:</p><ul><li><b>Image</b> – Template read-only (berlapis/layered) yang berisi aplikasi beserta seluruh dependensinya. Bayangkan seperti "blueprint" atau resep masakan.</li><li><b>Container</b> – Instance yang sedang berjalan dari sebuah Image (Image ditambah writable layer saat runtime). Satu Image bisa menghasilkan banyak Container.</li><li><b>Registry</b> – Tempat menyimpan dan berbagi Image (contoh: <a href="https://hub.docker.com/" target="_blank" rel="noopener">Docker Hub</a>, <a href="https://quay.io/" target="_blank" rel="noopener">Quay.io</a>, atau registry privat buatan sendiri).</li></ul>'
    },
    {
      type: 'example',
      title: 'Analogi Sederhana',
      lang: 'text',
      output: false,
      code: `Image  = Foto/Resep masakan (template, tidak bisa diubah)
Container = Masakan yang sedang dimasak/dihidangkan (bisa dijalankan, dihentikan, dihapus)
Registry  = Buku resep online (bisa dibagikan: pull/push)`,
      explain: [
        'Kamu bisa membuat banyak Container dari 1 Image yang sama.',
        'Perubahan saat runtime tidak mengubah Image aslinya.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Arsitektur Docker</h3><p>Docker menggunakan arsitektur <b>Client–Server</b>. Memahami arsitektur ini membantu kamu menebak penyebab error, misalnya ketika perintah berjalan tetapi tidak ada respons:</p><ul><li><b>Docker Client (docker)</b> – Program CLI yang kamu ketik di terminal. Tugasnya hanya mengirim permintaan.</li><li><b>Docker Daemon (dockerd)</b> – Proses berjalan di latar belakang (background) yang mengelola semua objek Docker: container, image, network, dan volume. Semua pekerjaan berat dilakukan di sini.</li><li><b>REST API</b> – Jembatan komunikasi antara Client dan Daemon (lewat unix socket di Linux/macOS atau TCP).</li></ul><p>Ketika kamu menjalankan <code>docker run</code>, Client mengirim permintaan melalui REST API ke Daemon, lalu Daemon yang mengeksekusinya. Karena pemisahan inilah, Client bisa berhenti tetapi container tetap berjalan.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Arsitektur Docker: client, REST API, daemon, dan registry">
        <rect x="30" y="30" width="180" height="60" rx="8" class="u-box"/>
        <text x="120" y="56" class="u-title">Registry (Docker Hub)</text>
        <text x="120" y="76" class="u-lbl" text-anchor="middle">simpan &amp; berbagi image</text>
        <rect x="30" y="130" width="180" height="90" rx="8" class="u-box"/>
        <text x="120" y="160" class="u-title">Docker Client (CLI)</text>
        <text x="120" y="182" class="u-lbl" text-anchor="middle">docker build / run / pull</text>
        <text x="120" y="200" class="u-lbl" text-anchor="middle">docker compose up</text>
        <line x1="210" y1="60" x2="266" y2="60" class="u-dash" marker-end="url(#u-arrow)"/>
        <text x="238" y="50" class="u-lbl" text-anchor="middle">pull / push</text>
        <line x1="210" y1="175" x2="266" y2="175" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="238" y="165" class="u-lbl" text-anchor="middle">REST API</text>
        <rect x="270" y="30" width="470" height="220" rx="10" class="u-box"/>
        <text x="505" y="60" class="u-title">Docker Daemon (dockerd)</text>
        <line x1="285" y1="76" x2="725" y2="76" class="u-line"/>
        <text x="505" y="98" class="u-lbl" text-anchor="middle">proses background yang mengelola semua objek Docker</text>
        <rect x="290" y="140" width="100" height="76" rx="8" class="u-hd"/>
        <text x="340" y="172" class="u-title">Images</text>
        <text x="340" y="196" class="u-lbl" text-anchor="middle">template</text>
        <rect x="400" y="140" width="100" height="76" rx="8" class="u-hd"/>
        <text x="450" y="172" class="u-title">Containers</text>
        <text x="450" y="196" class="u-lbl" text-anchor="middle">runtime</text>
        <rect x="510" y="140" width="100" height="76" rx="8" class="u-hd"/>
        <text x="560" y="172" class="u-title">Networks</text>
        <text x="560" y="196" class="u-lbl" text-anchor="middle">jaringan</text>
        <rect x="620" y="140" width="100" height="76" rx="8" class="u-hd"/>
        <text x="670" y="172" class="u-title">Volumes</text>
        <text x="670" y="196" class="u-lbl" text-anchor="middle">data</text>
        <text x="505" y="285" class="u-lbl" text-anchor="middle">CLI → REST API (unix socket / TCP) → daemon → objek di atas</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 1.2</b> — Client hanya "pemesan"; semua pekerjaan berat di daemon</figcaption></figure>`
    },
    {
      type: 'tip',
      title: 'Manfaat Docker',
      text: 'Docker membuat aplikasi konsisten antar lingkungan (masalah "works on my machine" berubah menjadi "works everywhere"), memberi isolasi antar aplikasi, lebih ringan dibanding VM, mudah diskalakan, serta deployment lebih aman dan dapat diulang dengan hasil sama (reproducible).'
    },
    {
      type: 'vocab',
      items: [
        ['Containerization', 'Teknik mengemas aplikasi beserta dependensinya agar dapat berjalan terisolasi dan konsisten di berbagai lingkungan.'],
        ['Image', 'Template read-only berlapis yang menjadi dasar pembuatan container.'],
        ['Container', 'Lingkungan runtime terisolasi hasil dari menjalankan sebuah Image.'],
        ['Registry', 'Repositori untuk menyimpan dan mendistribusikan Docker Image (contoh: Docker Hub).'],
        ['Daemon (dockerd)', 'Proses Docker di latar belakang yang melakukan semua pekerjaan berat.'],
        ['Client (docker)', 'Antarmuka CLI untuk berinteraksi dengan Docker Daemon.']
      ]
    }
  ],
  recap: [
    'Container bukan VM. Container berbagi kernel Host OS sehingga lebih ringan dan cepat.',
    'Image (template) menghasilkan Container (runtime). Banyak container dapat dibuat dari satu image.',
    'Registry menyimpan image; Docker Hub adalah registry publik bawaan.',
    'Arsitektur Docker: Client mengirim permintaan → REST API → Daemon yang mengeksekusi.'
  ]
});