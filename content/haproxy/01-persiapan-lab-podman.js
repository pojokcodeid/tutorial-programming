/* ============================================================
   Pelajaran HAProxy — 01: Persiapan Lab: Podman, Network, dan Workspace
   ============================================================ */
'use strict';

window.HAPROXY_LESSONS = window.HAPROXY_LESSONS || [];

window.HAPROXY_LESSONS.push({
  id: 'persiapan-lab-podman',
  title: 'Persiapan Lab: Podman, Network, dan Workspace',
  chapter: 'Fondasi',
  duration: '12 menit',
  intro: [
    'Bayangkan kamu ingin berlatih mengatur lalu lintas di sebuah gedung, tapi gedungnya belum dibangun. Semua teori tentang rambu, satpam, dan jalur evakuasi akan terasa abstrak sampai kamu berdiri di lapangan dan melihat lalu lintasnya bergerak. Bab HAProxy ini sama: <b>sebelum menyentuh konfigurasi, siapkan dulu lapangannya</b> — container, network, dan folder kerja.',
    'Pelajaran ini menyiapkan lab yang dipakai <b>seluruh 13 pelajaran berikutnya</b>: memastikan Podman siap, membuat workspace <code>haproxy-lab/</code>, membuat network khusus, lalu berlatih perintah container yang akan berulang setiap tahap (<code>run</code>, <code>inspect</code>, <code>logs</code>, <code>exec</code>, <code>stop</code>, <code>rm</code>).',
    'Kalau lab ini rapi sejak awal, kamu tidak akan terganggu oleh &quot;container tidak bisa diakses&quot; atau &quot;port sudah dipakai&quot; di tengah materi load balancing. Sekali bangun, dipakai berulang sampai capstone.'
  ],
  objectives: [
    'Memverifikasi instalasi Podman (termasuk Podman Machine pada macOS) dengan perintah pemeriksaan yang benar',
    'Membuat workspace <code>haproxy-lab/</code> dengan struktur folder haproxy, backend, certs, dan logs',
    'Membuat dan memahami peran Podman network untuk komunikasi antarcontainer berbasis nama',
    'Menjalankan, memeriksa, menghentikan, dan menghapus container percobaan sebagai bekal praktik selanjutnya'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Kenapa lab disiapkan di awal?</h3><p>Belajar load balancer tanpa lab ibarat belajar nyetir hanya dengan menonton video: kamu bisa menghafal nama tombol, tapi tidak tahu rasanya saat mobil mogok. Dalam bab ini kamu akan berulang kali melakukan hal yang sama — menyalakan container, mengubah konfigurasi, mematikan satu komponen, lalu mengamati apa yang terjadi. Perintah-perintah itu harus <b>otomatis di ujung jari</b> sebelum masuk ke materi berat seperti ACL, TLS, atau failover.</p><p>Tiga hal yang disiapkan di pelajaran ini:</p><ul><li><b>Runtime</b> — Podman terpasang, jalan, dan tahu kondisinya (versi, driver storage, network).</li><li><b>Workspace</b> — folder <code>haproxy-lab/</code> yang menjadi rumah semua file konfigurasi, sertifikat, dan log.</li><li><b>Network</b> — jaringan container bernama <code>haproxy-lab</code> tempat HAProxy dan backend saling menemukan satu sama lain lewat <b>nama container</b>.</li></ul>'
    },
    {
      type: 'text',
      html: '<h3>Prasyarat: yang perlu sudah kamu kuasai</h3><p>Kamu tidak perlu menjadi ahli networking untuk memulai. Cukup nyaman dengan hal-hal berikut; sisanya dipelajari sambil praktik:</p><table><thead><tr><th>Area</th><th>Yang cukup diketahui</th></tr></thead><tbody><tr><td><b>Terminal</b></td><td>Menjalankan perintah, <code>cd</code>, membaca output, membuka file dengan editor</td></tr><tr><td><b>Jaringan</b></td><td>IP address, port, DNS, perbedaan TCP dan HTTP secara kasar</td></tr><tr><td><b>HTTP</b></td><td>Request, response, method, status code, header</td></tr><tr><td><b>Container</b></td><td>Ide dasar: image vs container, port, volume, log</td></tr><tr><td><b>File konfigurasi</b></td><td>Tidak takut membaca file teks bertingkat seperti YAML atau konfigurasi HAProxy</td></tr></tbody></table><p>Kalau bagian HTTP masih goyang, materi <code>http.md</code> di repositori ini bisa dibaca paralel — justru menyenangkan karena kamu langsung melihat HTTP-nya bekerja di balik HAProxy.</p>'
    },
    {
      type: 'example',
      title: 'Verifikasi Podman sebelum memulai',
      lang: 'bash',
      output: false,
      code: `podman --version
podman info
podman ps
podman network ls

# macOS / Windows: pastikan mesin virtualnya hidup
podman machine list
podman machine start`,
      explain: [
        '<code>podman --version</code> mencetak versi — pastikan kamu mencatatnya karena sebagian sintaks dokumentasi bergantung versi. <code>podman info</code> menampilkan driver storage, rootless/tidak, dan network backend yang dipakai.',
        '<code>podman ps</code> harus menampilkan tabel kosong (belum ada container) tanpa galat; kalau galat, berarti daemon/sock Podman belum jalan.',
        'Pada macOS, Podman berjalan di dalam <b>mesin virtual Linux</b>: <code>podman machine list</code> menunjukkan statusnya, dan <code>podman machine start</code> menyalakannya bila masih <code>Stopped</code>. Inilah alasan nanti simulasi VIP/Keepalived punya keterbatasan khusus di macOS.',
        '<code>podman network ls</code> menampilkan jaringan bawaan (mis. <code>podman</code>); network lab yang akan dibuat berikutnya akan muncul di daftar ini.'
      ]
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Struktur lab HAProxy: folder haproxy-lab berisi haproxy.cfg, container backend, sertifikat, dan log yang terhubung lewat network haproxy-lab">
        <text x="30" y="34" class="u-title" text-anchor="start">Folder workspace: haproxy-lab/</text>
        <rect x="30" y="50" width="330" height="200" rx="10" class="u-box"/>
        <rect x="46" y="72" width="298" height="38" rx="6" class="u-hd"/>
        <text x="195" y="96" class="u-lbl" text-anchor="middle">haproxy/haproxy.cfg</text>
        <rect x="46" y="118" width="298" height="38" rx="6" class="u-box"/>
        <text x="195" y="142" class="u-lbl" text-anchor="middle">backend/ — halaman identitas tiap server</text>
        <rect x="46" y="164" width="298" height="38" rx="6" class="u-box"/>
        <text x="195" y="188" class="u-lbl" text-anchor="middle">certs/ — sertifikat lab (self-signed)</text>
        <rect x="46" y="210" width="298" height="30" rx="6" class="u-box"/>
        <text x="195" y="230" class="u-lbl" text-anchor="middle">logs/ &amp; compose.yaml</text>
        <line x1="366" y1="150" x2="428" y2="150" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="397" y="138" class="u-lbl" text-anchor="middle">mount ro</text>
        <rect x="434" y="72" width="296" height="156" rx="10" class="u-box"/>
        <text x="582" y="100" class="u-title" text-anchor="middle">Network: haproxy-lab</text>
        <rect x="452" y="116" width="260" height="42" rx="6" class="u-hd"/>
        <text x="582" y="142" class="u-lbl" text-anchor="middle">container haproxy (port 8080 host)</text>
        <rect x="452" y="170" width="124" height="42" rx="6" class="u-box"/>
        <text x="514" y="196" class="u-lbl" text-anchor="middle">web1</text>
        <rect x="588" y="170" width="124" height="42" rx="6" class="u-box"/>
        <text x="650" y="196" class="u-lbl" text-anchor="middle">web2, web3, ...</text>
        <text x="582" y="262" class="u-lbl" text-anchor="middle">HAProxy menemukan backend lewat NAMA container</text>
      </svg></div><figcaption>Workspace berisi file konfigurasi; network <code>haproxy-lab</code> menghubungkan HAProxy dengan backend lewat nama container.</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Membuat workspace dan network lab',
      lang: 'bash',
      output: false,
      code: `mkdir -p haproxy-lab/{haproxy,backend,certs,logs}
cd haproxy-lab
ls -la

podman network create haproxy-lab
podman network ls
podman network inspect haproxy-lab`,
      explain: [
        'Notasi kurung kurawal <code>{haproxy,backend,certs,logs}</code> membuat empat folder sekaligus: <code>haproxy/</code> untuk konfigurasi, <code>backend/</code> untuk halaman tiap server, <code>certs/</code> untuk sertifikat lab, dan <code>logs/</code> untuk file log.',
        '<code>podman network create haproxy-lab</code> membuat jaringan bridge khusus. Container yang bergabung ke network ini saling menjangkau memakai <b>nama container sebagai hostname</b> — jadi <code>server web1 web1:80</code> akan ter-resolve tanpa IP statis.',
        '<code>podman network inspect</code> menampilkan subnet, gateway, dan daftar container anggota — berguna saat mengecek kenapa HAProxy tidak bisa menemukan backend.'
      ]
    },
    {
      type: 'example',
      title: 'Uji cepat: container pertama &amp; perintah sehari-hari',
      lang: 'bash',
      output: false,
      code: `# uji bahwa runtime bekerja
podman run --rm docker.io/library/alpine:latest echo "Podman ready"

# perintah yang akan dipakai berulang di seluruh bab
podman images
podman ps -a
podman inspect <container>
podman logs <container>
podman exec -it <container> sh
podman stop <container>
podman rm <container>`,
      explain: [
        '<code>--rm</code> menghapus container begitu selesai — cocok untuk uji cepat agar tidak menumpuk container sampah. Output harus persis <code>Podman ready</code>.',
        'Kuartet <code>ps -a</code>, <code>logs</code>, <code>inspect</code>, dan <code>exec</code> adalah alat diagnosis harian: status, log, detail jaringan/konfigurasi, dan shell di dalam container.',
        '<code>exec -it ... sh</code> masuk ke container untuk memeriksa file atau proses; <code>stop</code> menghentikan (container masih ada) sedangkan <code>rm</code> menghapus permanen. Perbedaan ini penting saat simulasi <b>backend down</b> di pelajaran Health Check.'
      ]
    },
    {
      type: 'warn',
      title: 'Kesalahan umum persiapan lab',
      text: '<ul><li><b>Langsung menulis konfigurasi tanpa cek runtime</b> — <code>podman ps</code> galat berarti mesin Podman belum jalan, semua perintah berikutnya ikut gagal.</li><li><b>Memakai network default bawaan</b> — HAProxy dan backend bisa saja terhubung, tapi kamu kehilangan latihan menata network dan nama container secara sadar.</li><li><b>Port 8080 sudah terpakai</b> — proses lama masih jalan; cek dengan <code>podman ps -a</code> lalu hentikan, atau ganti port publik jadi <code>8081:80</code>.</li><li><b>Menjalankan perintah dari folder sembarang</b> — path relatif <code>./haproxy/haproxy.cfg</code> akan salah dan HAProxy mati dengan error <code>config file not found</code>.</li><li><b>Merapikan folder di tengah bab</b> — struktur folder berubah = banyak command lab yang harus diedit. Kunci strukturnya dari sekarang.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Satu terminal, satu folder kerja',
      text: '<p>Biasakan membuka terminal langsung di folder <code>haproxy-lab/</code> (di VS Code/Neovim: buka folder itu sebagai workspace). Semua perintah lab ditulis <b>dari dalam folder ini</b>, sehingga path mount <code>-v ./haproxy/haproxy.cfg:...</code> selalu cocok. Simpan juga output penting (misal hasil <code>podman network inspect</code>) ke <code>notes.md</code> — catatan kecil ini menyelamatkan waktu saat troubleshooting nanti.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Podman', 'Runtime container rootless tanpa daemon; dipakai sebagai pengganti Docker di seluruh bab ini.'],
        ['Image vs container', 'Image adalah cetakan berisi aplikasi; container adalah proses hasil menjalankan image itu.'],
        ['Podman network', 'Jaringan bridge khusus agar container saling menemukan lewat nama, bukan IP.'],
        ['Workspace', 'Folder kerja <code>haproxy-lab/</code> tempat seluruh file konfigurasi, sertifikat, dan log disimpan.'],
        ['Bind mount', 'Penyimpanan file host yang di-<i>mount</i> ke container, misal <code>haproxy.cfg</code> agar bisa diedit dari luar.'],
        ['Rootless', 'Container dijalankan sebagai pengguna biasa tanpa hak akses root — default Podman.'],
        ['Podman Machine', 'Mesin virtual Linux yang menaungi Podman pada macOS/Windows.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Jalankan keempat perintah verifikasi di atas dan <b>tuliskan</b> versi Podman, status machine, serta network apa saja yang ada di sistemmu.</li><li>Buat workspace <code>haproxy-lab/</code>, lalu buktikan strukturnya benar dengan <code>ls -la</code> dan <code>find haproxy-lab -type d</code>.</li><li>Buat network <code>haproxy-lab</code>, jalankan container Alpine pendek, lalu <b>hapus keduanya</b> (container dan network) untuk memastikan kamu menguasai siklus hidup container.</li><li><b>Checkpoint:</b> mampu menjalankan, memeriksa, menghentikan, dan menghapus container serta menjelaskan apa gunanya network container terpisah.</li></ol>'
    }
  ],
  recap: [
    'Lab dibangun sekali di awal: <b>Podman siap, workspace <code>haproxy-lab/</code> rapi, network khusus dibuat</b> — lalu dipakai berulang sampai capstone.',
    'Network <code>haproxy-lab</code> membuat container saling menemukan lewat <b>nama container</b>, bukan IP yang bisa berubah.',
    'Kuartet <code>ps -a</code>, <code>logs</code>, <code>inspect</code>, <code>exec</code> adalah alat diagnosis harian sepanjang bab ini.',
    'Pada macOS, Podman berjalan di <b>Podman Machine (VM Linux)</b> — catatan ini penting untuk simulasi VIP/Keepalived di pelajaran High Availability.'
  ]
});
