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
    '<b>Containerization</b> adalah cara mengemas aplikasi beserta semua dependensinya ke dalam satu paket terisolasi, agar bisa berjalan konsisten di mana saja (laptop, server, atau cloud).',
    '<b>Docker</b> adalah platform containerization yang paling populer. Docker membuat proses containerizing jadi jauh lebih mudah dibandingkan solusi sebelumnya.'
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
      html: '<h3>Apa itu Container?</h3><p>Container adalah lingkungan terisolasi untuk menjalankan aplikasi. Berbeda dengan VM yang menjalankan <b>Guest OS</b> penuh untuk tiap mesin virtual, container <b>memanfaatkan Host OS</b> melalui container runtime (Docker). Akibatnya, container jauh lebih ringan, cepat dijalankan, dan bisa di-scale dalam jumlah besar.</p>'
    },
    {
      type: 'example',
      title: 'Perbedaan VM vs Container (Konsep)',
      lang: 'text',
      output: false,
      code: `VM: Aplikasi + Guest OS + Hypervisor + Host OS + Hardware
Container: Aplikasi + Dependencies + Container Runtime (Docker) + Host OS + Hardware`,
      explain: [
        'VM memvirtualisasi seluruh mesin (termasuk OS).',
        'Container memvirtualisasi sistem operasi host (berbagi kernel).',
        'Hasilnya: container lebih ringan & startup jauh lebih cepat.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Konsep Dasar Docker</h3><p>Ada 3 konsep fundamental yang wajib dipahami:</p><ul><li><b>Image</b> – Template read-only (berlapis/layered) berisi aplikasi + dependensi. Mirip seperti "blueprint".</li><li><b>Container</b> – Instance yang sedang berjalan dari sebuah Image (Image + writable layer saat runtime).</li><li><b>Registry</b> – Tempat menyimpan & berbagi Image (contoh: <a href="https://hub.docker.com/" target="_blank" rel="noopener">Docker Hub</a>, <a href="https://quay.io/" target="_blank" rel="noopener">Quay.io</a>, registry privat).</li></ul>'
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
      html: '<h3>Arsitektur Docker</h3><p>Docker menggunakan arsitektur <b>Client–Server</b>:</p><ul><li><b>Docker Client (docker)</b> – CLI yang kamu pakai (terminal).</li><li><b>Docker Daemon (dockerd)</b> – Proses background yang mengelola objek Docker (container, image, network, volume).</li><li><b>REST API</b> – Jembatan komunikasi antara Client dan Daemon.</li></ul><p>Ketika kamu menjalankan perintah <code>docker run</code>, Client mengirim permintaan via REST API ke Daemon untuk dieksekusi.</p>'
    },
    {
      type: 'tip',
      title: 'Manfaat Docker',
      text: 'Konsisten antar lingkungan ("works on my machine" → "works everywhere"), isolasi, ringan, mudah diskalakan, deployment lebih aman & reproducible.'
    },
    {
      type: 'vocab',
      items: [
        ['Containerization', 'Teknik mengemas aplikasi + dependensi agar bisa berjalan terisolasi & konsisten.'],
        ['Image', 'Template read-only untuk membuat container (berlapis).'],
        ['Container', 'Lingkungan runtime terisolasi hasil dari menjalankan sebuah Image.'],
        ['Registry', 'Repositori untuk menyimpan & mendistribusikan Docker Image.'],
        ['Daemon (dockerd)', 'Proses background Docker yang melakukan pekerjaan berat.'],
        ['Client (docker)', 'Antarmuka CLI untuk berinteraksi dengan Docker Daemon.']
      ]
    }
  ],
  recap: [
    'Container ≠ VM. Container berbagi kernel Host OS → lebih ringan & cepat.',
    'Image (template) → Container (runtime). Banyak container bisa dibuat dari 1 image.',
    'Registry menyimpan image (Docker Hub default-nya).',
    'Arsitektur Docker: Client → REST API → Daemon.'
  ]
});