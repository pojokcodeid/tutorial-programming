/* ============================================================
   Pelajaran HAProxy — 09: High Availability — Dua HAProxy + Keepalived
   ============================================================ */
'use strict';

window.HAPROXY_LESSONS = window.HAPROXY_LESSONS || [];

window.HAPROXY_LESSONS.push({
  id: 'high-availability',
  title: 'High Availability: Dua HAProxy + Keepalived',
  chapter: 'High Availability',
  duration: '16 menit',
  intro: [
    'Bayangkan restoran dengan dua kasir: satu melayani antrean, satu lagi duduk di sebelahnya siap menggantikan. Meja kasirnya tetap di tempat yang sama, nomor antrean tetap sama — begitu kasir pertama jatuh sakit, kasir kedua langsung mengambil alih dan pelanggan tidak perlu pindah ke pintu lain.',
    'Meja kasir itu adalah <b>Virtual IP (VIP)</b>: satu alamat yang tidak menempel pada satu mesin, melainkan berpindah mengikuti siapa yang sedang sehat. Di balik perpindahan itu ada <b>Keepalived</b> yang berbicara protokol <b>VRRP</b> antarnode, memantau proses HAProxy lewat skrip, dan memindahkan VIP bila node aktif bermasalah.',
    'Pelajaran ini membedah active-passive vs active-active, konfigurasi Keepalived lengkap dua node, skenario uji failover dan failback, konsep split brain, serta keterbatasan nyata Podman di macOS beserta alternatif pendekatan pengujian yang realistis untuk lab kamu.'
  ],
  objectives: [
    'Membandingkan pola active-passive dan active-active beserta peran VIP, failover, dan failback',
    'Menjelaskan cara kerja VRRP/Keepalived: priority, advert_int, vrrp_script, notify, dan preemption',
    'Menulis konfigurasi Keepalived untuk node MASTER dan BACKUP yang mengawasi proses HAProxy',
    'Menyusun skenario uji failover yang terukur serta membedakannya dari failover backend'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Active-passive, active-active, dan siapa yang ikut mati</h3><p>High availability berarti <b>melayani terus meski komponen mati</b>. Ada dua gaya utama:</p><table><thead><tr><th>Pola</th><th>Cara kerja</th><th>Plus / minus</th></tr></thead><tbody><tr><td><b>Active-passive</b> (lab ini)</td><td>Satu node melayani, satu lagi standby dengan VIP menganggur</td><td>Sederhana dan mudah diuji; resource standby tidak terpakai</td></tr><tr><td><b>Active-active</b></td><td>Kedua node melayani bersama, umumnya di belakang DNS round-robin atau klaster</td><td>Resource terpakai penuh; lebih rumit (state, session, reload serentak)</td></tr></tbody></table><p>Dua tingkat kegagalan harus dibedakan tegas: <b>failover backend</b> — server web mati, health check mengeluarkannya dari pool, request dialihkan ke server sehat (sudah kamu praktikkan di pelajaran Health Check); dan <b>failover proxy node</b> — HAProxy itu sendiri atau mesinnya yang mati. Untuk kasus kedua, client harus tetap punya alamat tujuan yang hidup, dan di situlah VIP plus Keepalived bekerja.</p><p><b>Failover</b> adalah perpindahan saat kegagalan terjadi; <b>failback</b> adalah pengembalian setelah node sembuh — perilakunya ditentukan oleh konfigurasi <b>priority</b> dan <b>preemption</b>.<b>Split brain</b> adalah kegagalan konseptual yang paling ditakuti: bila komunikasi antarnode terputus, <b>keduanya bisa menganggap dirinya MASTER</b> dan dua host memegang VIP yang sama — trafik jadi liar dan sangat sulit ditelusuri.</p>'
    },
    {
      type: 'text',
      html: '<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 340" width="760" role="img" aria-label="Arsitektur high availability: client mengakses Virtual IP yang dipegang HAProxy 1 sebagai MASTER dengan Keepalived 1, sementara HAProxy 2 dan Keepalived 2 standby, dan kedua node mengarah ke dua backend">\n        <text x="20" y="30" class="u-title" text-anchor="start">Arsitektur lab: 2 HAProxy + 2 Keepalived + VIP</text>\n        <rect x="20" y="140" width="120" height="70" rx="8" class="u-hd"/>\n        <text x="80" y="170" class="u-title" text-anchor="middle">Client</text>\n        <text x="80" y="194" class="u-lbl" text-anchor="middle">curl VIP</text>\n        <line x1="146" y1="175" x2="184" y2="175" class="u-line" marker-end="url(#u-arrow)"/>\n        <rect x="190" y="130" width="140" height="90" rx="8" class="u-box"/>\n        <text x="260" y="162" class="u-title" text-anchor="middle">Virtual IP</text>\n        <text x="260" y="188" class="u-lbl" text-anchor="middle">192.168.56.100</text>\n        <line x1="336" y1="150" x2="374" y2="95" class="u-line" marker-end="url(#u-arrow)"/>\n        <text x="336" y="142" class="u-lbl" text-anchor="start">aktif</text>\n        <line x1="336" y1="200" x2="374" y2="255" class="u-line" marker-end="url(#u-arrow)"/>\n        <text x="336" y="214" class="u-lbl" text-anchor="start">standby</text>\n        <rect x="380" y="55" width="180" height="80" rx="8" class="u-hd"/>\n        <text x="470" y="84" class="u-title" text-anchor="middle">haproxy1 - MASTER</text>\n        <text x="470" y="110" class="u-lbl" text-anchor="middle">keepalived1 (prio 110)</text>\n        <rect x="380" y="215" width="180" height="80" rx="8" class="u-box"/>\n        <text x="470" y="244" class="u-title" text-anchor="middle">haproxy2 - BACKUP</text>\n        <text x="470" y="270" class="u-lbl" text-anchor="middle">keepalived2 (prio 100)</text>\n        <line x1="470" y1="141" x2="470" y2="209" class="u-line" marker-end="url(#u-arrow)"/>\n        <text x="482" y="180" class="u-lbl" text-anchor="start">VRRP</text>\n        <line x1="566" y1="95" x2="604" y2="95" class="u-line" marker-end="url(#u-arrow)"/>\n        <line x1="566" y1="255" x2="604" y2="255" class="u-line" marker-end="url(#u-arrow)"/>\n        <rect x="610" y="60" width="140" height="70" rx="8" class="u-box"/>\n        <text x="680" y="90" class="u-title" text-anchor="middle">backend1</text>\n        <text x="680" y="114" class="u-lbl" text-anchor="middle">web1</text>\n        <rect x="610" y="220" width="140" height="70" rx="8" class="u-box"/>\n        <text x="680" y="250" class="u-title" text-anchor="middle">backend2</text>\n        <text x="680" y="274" class="u-lbl" text-anchor="middle">web2</text>\n        <text x="380" y="330" class="u-lbl" text-anchor="middle">VIP menempel pada node yang berstatus MASTER; keduanya mengarah ke pool backend yang sama</text>\n      </svg></div><figcaption>Client selalu bicara ke VIP. Keepalived memutuskan siapa yang memegang VIP berdasarkan VRRP, priority, dan hasil pemeriksaan skrip HAProxy.</figcaption></figure>'
    },
    {
      type: 'example',
      title: 'Konfigurasi HAProxy yang identik di kedua node',
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
    balance roundrobin
    option httpchk GET /
    server web1 192.168.56.11:80 check
    server web2 192.168.56.12:80 check`,
      explain: [
        'Konfigurasi HAProxy <b>dibuat sama persis di kedua node</b> — justru begitu: begitu VIP pindah, node pengganti melayani dengan aturan, backend, dan log yang identik sehingga client tidak merasakan perbedaan.',
        'Server backend ditulis memakai alamat yang bisa dijangkau kedua node (di sini IP backend), bukan nama container yang hanya ada di satu host.',
        '<code>option httpchk GET /</code> menjaga health check tetap aktif; jangan sampai node standby malah menyalurkan request ke backend yang sakit hanya karena konfigurasinya beda.',
        'Karena ini <code>mode http</code>, TLS dan routing boleh disesuaikan dengan pelajaran sebelumnya tanpa mengubah skema failover.'
      ]
    },
    {
      type: 'example',
      title: 'keepalived.conf: MASTER dan BACKUP',
      lang: 'cfg',
      output: false,
      code: `! /etc/keepalived/keepalived.conf -- node1 (MASTER)
global_defs {
    router_id HAPROXY_LAB_1
    enable_script_security
}

vrrp_script chk_haproxy {
    script "/usr/bin/pgrep -x haproxy"
    interval 2
    weight -30
    fall 3
    rise 2
}

vrrp_instance VI_1 {
    state MASTER
    interface enp0s3
    virtual_router_id 51
    priority 110
    advert_int 1

    authentication {
        auth_type PASS
        auth_pass labpass24
    }

    virtual_ipaddress {
        192.168.56.100/24
    }

    track_script {
        chk_haproxy
    }

    notify_master "/etc/keepalived/notify.sh master"
    notify_backup "/etc/keepalived/notify.sh backup"
}

! node2 (BACKUP): sama, hanya router_id HAPROXY_LAB_2, state BACKUP, priority 100`,
      explain: [
        '<code>router_id</code> hanya nama unik tiap node (tampil di pesan log), sedangkan <code>virtual_router_id 51</code> harus <b>sama</b> untuk sepasang node ini dan berbeda dari grup VRRP lain di jaringan yang sama.',
        '<code>vrrp_script chk_haproxy</code> memeriksa proses HAProxy tiap 2 detik; <code>fall 3</code> menetapkan dianggap gagal setelah 3 kali beruntun, <code>rise 2</code> untuk kembali sehat, dan <code>weight -30</code> menurunkan priority sebesar 30 saat skrip gagal — priority 110 menjadi 80, lebih rendah dari BACKUP (100), sehingga VIP berpindah.',
        '<code>state MASTER</code> + <code>priority 110</code> vs <code>state BACKUP</code> + <code>priority 100</code>: dalam VRRP, node dengan priority tertinggi yang menguasai VIP; priority juga menentukan perilaku kembali (preemption) setelah node awal sembuh.',
        '<code>advert_int 1</code> adalah jeda pengumuman (detik) antarnode — semakin besar, semakin lambat kegagalan terdeteksi; <code>authentication</code> sekadar penyaring kasar, bukan keamanan serius.',
        '<code>virtual_ipaddress</code> adalah VIP yang menempel pada node MASTER, <code>track_script</code> menghubungkan pemeriksaan HAProxy dengan instance VRRP, dan <code>notify_master/notify_backup</code> menjalankan skrip (harus executable) untuk mencatat atau memberi tahu tim saat status berubah.'
      ]
    },
    {
      type: 'example',
      title: 'Skenario uji failover dan failback',
      lang: 'bash',
      output: false,
      code: `# 1. validasi konfigurasi sebelum jalan
sudo keepalived -t -f /etc/keepalived/keepalived.conf
# 2. nyalakan di kedua node, pastikan VIP di node1
sudo systemctl enable --now haproxy keepalived
ip addr show enp0s3 | grep 192.168.56.100
# 3. traffic stabil ke VIP
for i in $(seq 1 10); do
  curl -s -o /dev/null -w "%{http_code}\\n" http://192.168.56.100/
done

# 4. matikan HAProxy pada node MASTER (memancing vrrp_script)
sudo systemctl stop haproxy
# 5. amati VIP pindah dan jejak keputusan keepalived
ip addr show enp0s3 | grep 192.168.56.100
journalctl -u keepalived -n 20 --no-pager
# 6. uji lagi -- endpoint tidak berubah sama sekali
curl -si http://192.168.56.100/ | head -n 1
# 7. hidupkan kembali, amati preemption (VIP balik ke priority lebih tinggi)
sudo systemctl start haproxy
ip addr show enp0s3 | grep 192.168.56.100`,
      explain: [
        '<code>keepalived -t</code> memvalidasi konfigurasi tanpa menjalankannya — lakukan ini dulu karena satu kesalahan <code>interface</code> atau <code>virtual_router_id</code> membuat failover gagal diam-diam.',
        'Langkah 3–5 adalah inti uji: matikan HAProxy (bukan mesinnya), skrip <code>chk_haproxy</code> gagal 3 kali, priority node1 turun, VRRP mengalah, lalu VIP berpindah ke node2 dalam hitungan detik.',
        'Langkah 6 membuktikan sifat VIP: client tetap memanggil <code>192.168.56.100</code> — tidak ada DNS yang diubah, tidak ada konfigurasi client yang disentuh.',
        'Langkah 7 menguji failback: saat HAProxy1 hidup lagi, priority 110 mengalahkan 100 dan VIP kembali (preemption aktif). Kalau kamu tidak ingin gangguan perpindahan balik, tambahkan <code>nopreempt</code> di instance dan bandingkan perilakunya.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Keterbatasan Podman dan pendekatan alternatif</h3><p>Di sini kamu harus jujur pada lingkungan lab. Pada <b>macOS, Podman berjalan di dalam Podman Machine (VM Linux)</b>, dan beberapa syarat VRRP sulit sekali dipenuhi:</p><ul><li><b>Multicast VRRP tidak menembus</b> — VRRP memakai protokol IP 112 dengan alamat multicast; adapter <code>slirp4netns</code>/<code>gvproxy</code> di macOS tidak meneruskannya, sehingga kedua node tidak pernah saling mendengar pengumuman.</li><li><b>Host networking tidak tersedia seperti di Linux</b> — <code>--network host</code> pada macOS merujuk ke VM, bukan mesin macOS-mu, sehingga menempelkan VIP ke antarmuka host tidak bisa dilakukan bebas.</li><li><b>Keepalived butuh kendali jaringan</b> — ia harus menambah alamat ke interface dan sering butuh kapabilitas <code>NET_ADMIN</code>; container rootless biasa tidak memilikinya.</li></ul><p>Pendekatan yang realistis: (1) jalankan lab HA di <b>dua VM Linux</b> (multipass/libvirt/Vagrant) dengan bridge, tempat Keepalived berjalan sebagai layanan host; (2) bila kamu punya Linux, pakai <b>netavark bridge</b> atau mode host dan jalankan Keepalived di host, bukan di container; (3) bila multicast diblokir, gunakan <b>unicast VRRP</b> (<code>unicast_src_ip</code> dan <code>unicast_peer</code>) agar pengumuman dikirim langsung ke IP rekan; (4) bila VIP sama sekali mustahil, <b>uji manual</b> dengan mengganti endpoint client — arahkan <code>curl</code> ke node1, matikan, arahkan ke node2 — untuk melatih urutan runbook tanpa VRRP.</p><blockquote style="border-left:3px solid var(--accent);padding-left:12px;margin:12px 0">Ingat dua level: <b>failover backend</b> ditangani health check HAProxy (pelajaran 4–5), <b>failover node</b> ditangani VIP + Keepalived (pelajaran ini). Node standby tetap butuh backend yang sehat — keduanya melengkapi, bukan menggantikan.</blockquote>'
    },
    {
      type: 'warn',
      title: 'Kesalahan umum dan jebakan split brain',
      text: '<ul><li><b>Mengira lab macOS sudah menguji failover</b> — kalau VIP tak pernah terbukti berpindah dengan <code>ip addr</code>, kamu baru menguji konfigurasi teks, bukan mekanismenya.</li><li><b>Priority sama</b> — kedua node punya nilai identik; keputusan jadi tidak deterministik dan mudah berpindah-pindah.</li><li><b><code>virtual_router_id</code> bentrok</b> antargrup VRRP di jaringan yang sama menghasilkan pertarungan master yang terus-menerus.</li><li><b><code>interface</code> salah</b> (<code>enp0s3</code> vs <code>eth0</code>) — keepalived langsung gagal start; cek dengan <code>ip link</code>.</li><li><b>Tanpa <code>vrrp_script</code></b> — HAProxy mati tapi VIP tetap di node itu, dan client terus diarahkan ke lubang hitam.</li><li><b>Split brain saat jaringan antarnode putus</b> — dua node menganggap diri MASTER dan dua host memegang VIP; pahami konsepnya, dan minimal ketahui cara mendeteksinya (cek <code>ip addr</code> di kedua node dan lihat siapa yang benar-benar mengirim ke backend).</li></ul>'
    },
    {
      type: 'tip',
      title: 'Belajar failover tanpa VIP',
      text: '<p>Kalau VIP belum memungkinkan di lab-mu, tetaplah berlatih <b>alur dan runbook-nya</b>: jalankan dua proses HAProxy pada dua port (misal 8081 dan 8082) dengan konfigurasi identik, lalu geser trafik secara manual — <code>curl http://localhost:8081/</code>, matikan proses itu, pindah ke 8082, hidupkan lagi. Rekam tiap langkah beserta perintah pemeriksaannya ke <code>failover-runbook.md</code>. Saat kamu nanti menjalankan lab di VM Linux, kamu tinggal menukar endpoint dengan VIP — konsep, bukti, dan urutan pengujianmu sudah teruji lebih dulu.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['VIP (Virtual IP)', 'Satu alamat yang tidak menempel pada satu mesin; berpindah mengikuti node aktif.'],
        ['VRRP', 'Virtual Router Redundancy Protocol — protokol yang membuat node-node saling mengumumkan status dan memilih penguasa VIP.'],
        ['Keepalived', 'Program yang mengelola VRRP dan menjalankan skrip pemeriksaan (mis. proses HAProxy) untuk memutuskan perebutan VIP.'],
        ['MASTER / BACKUP', 'Status VRRP: MASTER memegang VIP dan melayani, BACKUP menunggu pengumuman berhenti.'],
        ['Priority', 'Angka prioritas VRRP; tertinggi menjadi MASTER, selisihnya dipakai memutuskan preemption.'],
        ['Failover', 'Perpindahan layanan ke node/survivor lain saat komponen aktif gagal.'],
        ['Failback', 'Pengembalian layanan ke node asal setelah pulih, sesuai kebijakan priority/nopreempt.'],
        ['Split brain', 'Kondisi ketika komunikasi antarnode putus sehingga dua node sama-sama menganggap dirinya MASTER.'],
        ['vrrp_script', 'Blok konfigurasi Keepalived yang menjalankan pemeriksaan berkala dan menyesuaikan priority.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Tulis dua kolom perbedaan <b>failover backend</b> dan <b>failover proxy node</b>: apa yang mati, siapa yang mendeteksi, apa yang berpindah, dan apa yang dilihat client.</li><li>Susun <code>keepalived.conf</code> dua node sesuai lab-mu (sesuaikan <code>interface</code> dengan <code>ip link</code>), lalu validasi dengan <code>keepalived -t</code> sebelum dijalankan.</li><li>Kerjakan skenario uji langkah 1–7, catat waktu dari &quot;HAProxy dimatikan&quot; sampai &quot;VIP pindah&quot;, dan identifikasi parameter mana yang memengaruhi lamanya (<code>interval</code>, <code>fall</code>, <code>advert_int</code>).</li><li><b>Checkpoint:</b> mampu menjelaskan dan menguji failover proxy node — VIP berpindah, request tetap terjawab, lalu failback terjadi sesuai konfigurasi priority — bukan hanya failover backend.</li></ol>'
    }
  ],
  recap: [
    '<b>Active-passive</b> memakai VIP yang berpindah antar node; <b>failover</b> saat kegagalan, <b>failback</b> saat pemulihan, dan keduanya ditentukan priority + preemption.',
    '<b>VRRP</b> (dielola Keepalived) memilih penguasa VIP: priority tertinggi menang, pengumuman (<code>advert_int</code>) mendeteksi kegagalan.',
    '<b><code>vrrp_script</code> + <code>weight</code></b> menghubungkan kesehatan HAProxy dengan kepemilikan VIP; <code>notify_master/notify_backup</code> memberi tahu saat status berubah.',
    'Di macOS, Podman berada di VM sehingga <b>multicast VRRP, host networking, dan VIP sering tak didukung</b> — alternatifnya VM Linux, netavark/host network, unicast VRRP, atau uji manual dengan mengganti endpoint.'
  ]
});
