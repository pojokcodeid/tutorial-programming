/* ============================================================
   Pelajaran HAProxy — 04: Load Balancing: Algoritma, Weight, dan Distribusi
   ============================================================ */
'use strict';

window.HAPROXY_LESSONS = window.HAPROXY_LESSONS || [];

window.HAPROXY_LESSONS.push({
  id: 'load-balancing',
  title: 'Load Balancing: Algoritma, Weight, dan Distribusi',
  chapter: 'Konfigurasi Dasar',
  duration: '15 menit',
  intro: [
    'Bayangkan satu kasir melayani antrean sementara tiga kasir lain berdiri menganggur di sebelahnya. Manajer toko lalu memasang sistem giliran: setiap pelanggan berikutnya dilayani kasir berikutnya, dan pelanggan yang membawa belanjaan raksasa diarahkan ke kasir yang paling sepi. <b>Itulah esensi load balancing</b> — membagi pekerjaan secara sadar, bukan membiarkan kebetulan menentukan.',
    'Di pelajaran ini kamu menambah <code>web1</code>, <code>web2</code>, dan <code>web3</code> yang semuanya menyajikan halaman identik tapi dengan identitas berbeda, lalu mengubah backend-mu menjadi tiga server. Dari situ kamu menguji empat algoritma HAProxy: <code>roundrobin</code>, <code>leastconn</code>, <code>static-rr</code>, dan <code>source</code>, termasuk cara memberi <code>weight</code> agar porsi traffic tidak seragam.',
    'Kamu juga akan menjalankan loop <code>curl</code> 20 kali untuk mengamati distribusi nyata, memahami kapan tiap algoritma tepat dipakai, menimbang konsekuensi NAT pada algoritma <code>source</code>, dan yang paling penting: <b>kenapa distribusi tidak akan pernah persis rata</b> — serta mengapa itu bukan bug.'
  ],
  objectives: [
    'Menyiapkan tiga backend dengan halaman identitas berbeda dan menggabungkannya dalam satu backend HAProxy',
    'Menerapkan algoritma roundrobin, leastconn, static-rr, source, serta weight pada baris server',
    'Mengamati distribusi request dengan loop curl 20 kali dan membaca hasilnya secara kritis',
    'Memilih algoritma sesuai karakteristik workload serta menjelaskan konsekuensi NAT dan distribusi yang tidak pernah persis rata'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Menyiapkan tiga backend yang mudah dikenali</h3><p>Load balancing hanya terasa nyata kalau kamu bisa <b>membuktikan</b> request benar-benar berpindah antar server. Caranya: buat tiga halaman yang identik bentuknya tapi berbeda identitasnya, lalu mount masing-masing sebagai <code>index.html</code> container. Dengan begitu satu baris <code>curl</code> sudah menjawab &quot;ke server mana request ini jatuh?&quot;.</p><p>Ketiga container memakai network yang sama dengan HAProxy, sehingga nama <code>web1</code>, <code>web2</code>, dan <code>web3</code> bisa langsung ditulis di konfigurasi tanpa IP statis.</p>'
    },
    {
      type: 'example',
      title: 'Siapkan halaman identitas dan jalankan tiga container',
      lang: 'bash',
      output: false,
      code: `mkdir -p backend
for n in 1 2 3; do echo "<h1>Halo dari web$n</h1>" > backend/web$n.html; done

podman run -d --name web1 --network haproxy-lab -v ./backend/web1.html:/usr/share/nginx/html/index.html:ro docker.io/library/nginx:alpine
podman run -d --name web2 --network haproxy-lab -v ./backend/web2.html:/usr/share/nginx/html/index.html:ro docker.io/library/nginx:alpine
podman run -d --name web3 --network haproxy-lab -v ./backend/web3.html:/usr/share/nginx/html/index.html:ro docker.io/library/nginx:alpine
podman ps`,
      explain: [
        'Tiga file <code>backend/webN.html</code> berisi teks identitas yang berbeda — inilah &quot;name tag&quot; yang membuat distribusi traffic terlihat mata.',
        'Setiap <code>podman run</code> memount file itu ke <code>/usr/share/nginx/html/index.html</code> secara <code>:ro</code>, yaitu lokasi default halaman awal nginx, sehingga membuka root akan langsung menampilkan identitas container.',
        'Jika web1 sudah ada dari pelajaran sebelumnya, cukup <code>podman rm -f web1</code> dulu sebelum menjalankan ulang baris pertama; nama container tidak boleh bentrok.',
        '<code>podman ps</code> harus menampilkan tiga container berstatus <code>Up</code> — pastikan semuanya baru lalu lanjut menulis konfigurasi.'
      ]
    },
    {
      type: 'example',
      title: 'Satu backend berisi tiga server (roundrobin)',
      lang: 'cfg',
      output: false,
      code: `backend web_servers
    balance roundrobin
    server web1 web1:80 check
    server web2 web2:80 check
    server web3 web3:80 check`,
      explain: [
        '<code>balance roundrobin</code> menetapkan algoritma: tiap koneksi baru diarahkan ke server berikutnya secara bergiliran, dengan bobot tiap server ikut menentukan lebar giliran.',
        'Setiap baris <code>server</code> menyusun satu anggota pool: nama bebas (<code>web1</code>), tujuan <code>web1:80</code> yang di-resolve lewat nama container, dan <code>check</code> yang menyalakan health check bawaan.',
        'Backend lama yang hanya berisi web1 cukup ditambah dua baris — <code>default_backend</code> di frontend tidak perlu diubah sama sekali karena tetap menunjuk <code>web_servers</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Empat algoritma dan cara membaca weight',
      lang: 'cfg',
      output: false,
      code: `# giliran per koneksi sesuai bobot (dinamis, paling umum untuk HTTP) - aktif
balance roundrobin
# balance leastconn      # pilih server dengan koneksi aktif paling sedikit
# balance static-rr      # giliran statis; ubah weight saat jalan baru berlaku setelah reload
# balance source         # hash IP client: client yang sama selalu ke server yang sama

# bobot tidak seragam: porsi traffic mengikuti perbandingan 5 : 2 : 1
server web1 web1:80 check weight 5
server web2 web2:80 check weight 2
server web3 web3:80 check weight 1`,
      explain: [
        'Ganti saja nilai <code>balance</code> untuk mengubah algoritma; hanya satu yang aktif pada satu backend, dan perubahan butuh restart/reload container HAProxy di lab ini.',
        '<code>weight</code> ditulis per server, bukan per backend. Dengan perbandingan 5 : 2 : 1, web1 menerima porsi terbesar selama semua server sehat.',
        '<code>static-rr</code> bersifat statis: mengubah weight saat HAProxy berjalan tidak berpengaruh sampai konfigurasi dimuat ulang, sedangkan <code>roundrobin</code> dinamis dan bisa menyesuaikan bobot di tengah jalan.',
        '<code>source</code> membuat keputusan deterministik dari IP client — menarik untuk konsistensi, tapi bermasalah di balik NAT (dibahas di bawah).'
      ]
    },
    {
      type: 'example',
      title: 'Amati distribusi dengan loop curl 20 kali',
      lang: 'bash',
      output: false,
      code: `for i in $(seq 1 20); do
  curl -s http://localhost:8080
done

# hitung langsung per identitas
for i in $(seq 1 20); do
  curl -s http://localhost:8080
done | sort | uniq -c`,
      explain: [
        'Loop 20 kali mengirim 20 request terpisah — masing-masing membuka koneksi baru, sehingga roundrobin punya 20 kesempatan memutar giliran.',
        'Versi kedua menyusun hasilnya dengan <code>sort | uniq -c</code>: kamu langsung mendapat angka seperti &quot;7 web1, 7 web2, 6 web3&quot; sebagai bukti distribusi, bukan sekadar dugaan.',
        'Jalankan perintah yang sama setelah mengganti <code>balance</code> menjadi <code>leastconn</code>, <code>static-rr</code>, dan <code>source</code> lalu bandingkan hitungannya — inilah lab inti pelajaran ini.'
      ]
    },
    {
      type: 'example',
      title: 'Bentuk hasil yang akan kamu lihat',
      lang: 'text',
      output: false,
      code: `roundrobin (semua sehat, weight seragam): 7 web1, 7 web2, 6 web3 - hampir merata
weight 5 : 2 : 1 (roundrobin): 12 web1, 5 web2, 3 web3 - porsi mengikuti bobot
source (20 request dari IP lokal yang sama): 20 web1, 0 web2, 0 web3 - deterministik
source (beragam IP di balik NAT): sebaran mengikuti hash, bisa menumpuk ke satu server`,
      explain: [
        'Angka 7-7-6 menunjukkan distribusi <b>hampir</b> merata: rotasi berjalan per koneksi dan 20 tidak habis dibagi tiga — sisa satu server kebagian satu request lebih sedikit.',
        'Dengan weight 5 : 2 : 1, rasio 12 : 5 : 3 mendekati 12,5 : 5 : 2,5 — pembulatan giliran membuat angkanya tidak persis, tapi porsinya jelas berbeda.',
        'Pada algoritma <code>source</code>, semua request dari IP yang sama di-lab memang masuk ke satu server — ini bukan kegagalan load balancing, melainkan konsekuensi langsung dari desainnya.'
      ]
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Distribusi roundrobin: loop curl 20 kali masuk ke HAProxy dengan balance roundrobin lalu terbagi ke web1, web2, dan web3 dengan jumlah request hampir sama">
        <text x="20" y="34" class="u-title" text-anchor="start">Amati: 20 request dibagi bergiliran</text>
        <rect x="20" y="112" width="150" height="64" rx="8" class="u-hd"/>
        <text x="95" y="140" class="u-lbl" text-anchor="middle">for i in 1..20</text>
        <text x="95" y="164" class="u-lbl" text-anchor="middle">curl localhost:8080</text>
        <line x1="176" y1="144" x2="222" y2="144" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="228" y="72" width="216" height="168" rx="10" class="u-box"/>
        <text x="336" y="100" class="u-title" text-anchor="middle">HAProxy</text>
        <rect x="242" y="114" width="188" height="44" rx="6" class="u-hd"/>
        <text x="336" y="142" class="u-lbl" text-anchor="middle">frontend :8080</text>
        <rect x="242" y="170" width="188" height="52" rx="6" class="u-box"/>
        <text x="336" y="192" class="u-lbl" text-anchor="middle">backend web_servers</text>
        <text x="336" y="212" class="u-lbl" text-anchor="middle">balance roundrobin</text>
        <line x1="450" y1="98" x2="512" y2="98" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="450" y1="156" x2="512" y2="156" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="450" y1="214" x2="512" y2="214" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="518" y="74" width="170" height="48" rx="6" class="u-hd"/>
        <text x="603" y="104" class="u-lbl" text-anchor="middle">web1 - 7 request</text>
        <rect x="518" y="132" width="170" height="48" rx="6" class="u-box"/>
        <text x="603" y="162" class="u-lbl" text-anchor="middle">web2 - 7 request</text>
        <rect x="518" y="190" width="170" height="48" rx="6" class="u-box"/>
        <text x="603" y="220" class="u-lbl" text-anchor="middle">web3 - 6 request</text>
        <text x="380" y="276" class="u-lbl" text-anchor="middle">giliran dibuka per koneksi: mendekati merata, tidak pernah dijamin persis</text>
      </svg></div><figcaption>Loop curl 20 kali membuktikan rotasi roundrobin ke tiga server dengan selisih kecil yang wajar.</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Kapan tiap algoritma tepat dipakai?</h3><table><thead><tr><th>Algoritma</th><th>Paling cocok untuk</th><th>Hindari ketika</th></tr></thead><tbody><tr><td><code>roundrobin</code></td><td>Request HTTP berdurasi pendek dan seragam (halaman, API ringan) — pilihan default yang adil</td><td>Durasi request sangat bervariasi, karena giliran tidak melihat lama request</td></tr><tr><td><code>leastconn</code></td><td>Sesi panjang dan bervariasi: SQL, LDAP, sesi berat lain — server paling sepi diprioritaskan</td><td>Request sangat pendek; HAProxy sendiri menyebutnya kurang cocok untuk HTTP singkat</td></tr><tr><td><code>static-rr</code></td><td>Pool statis yang jarang berubah dan perlu reintegrasi server seketika</td><td>Kamu sering menyesuaikan weight saat jalan (perubahan diabaikan sampai reload)</td></tr><tr><td><code>source</code></td><td>Klien tertentu harus selalu ke server yang sama tanpa cookie (mis. pembagian zona)</td><td>Ada NAT atau jumlah client jauh lebih besar daripada server</td></tr></tbody></table><p>Bobot paling berpengaruh pada <code>roundrobin</code> dan <code>static-rr</code>; <code>leastconn</code> juga memperhitungkan bobot saat memilih server paling sepi.</p>'
    },
    {
      type: 'text',
      html: '<h3>Kenapa distribusi tidak pernah persis rata?</h3><p>Ini pertanyaan yang paling sering muncul setelah loop curl pertama. Bukan karena HAProxy salah, tapi karena <b>distribusi dipengaruhi banyak faktor nyata</b>:</p><ul><li><b>20 tidak habis dibagi 3</b> — sisa pembagian selalu jatuh ke server tertentu pada rotasi tertentu.</li><li><b>Bobot berbeda</b> — dengan weight 5 : 2 : 1, ketimpangan itu memang disengaja.</li><li><b>Health check mengecualikan server</b> — saat satu server dinyatakan down, seluruh bagiannya berpindah ke yang lain sampai pulih.</li><li><b>Roundrobin bersifat dinamis</b> — menurut dokumentasi HAProxy, server yang baru pulih setelah down singkat kadang butuh puluhan sampai ratusan request sebelum kembali masuk rotasi penuh.</li><li><b>Koneksi ≠ request</b> — dengan keep-alive, satu koneksi membawa banyak request; hitungan koneksi yang dibagi, bukan hitungan halaman.</li><li><b>Algoritma lain memang tidak mengejar kesamaan angka</b> — <code>leastconn</code> mengikuti beban sesaat, <code>source</code> mengikuti hash IP.</li></ul><p>Termasuk konsekuensi <b>NAT</b>: di balik satu IP keluar (kantor, load balancer cloud, proxy), puluhan client terlihat sebagai satu sumber sehingga <code>balance source</code> menumpuk semuanya ke satu server — dan saat IP berubah (jaringan seluler), client bisa tiba-tiba berpindah server.</p>'
    },
    {
      type: 'warn',
      title: 'Kesalahan umum saat membagi traffic',
      text: '<ul><li><b>Mengejar angka 33% : 33% : 33%</b> — distribusi adalah tren jangka panjang, bukan hasil tiap 20 request.</li><li><b>Memakai <code>source</code> di lingkungan penuh NAT</b> — satu IP publik = satu server kebanjiran, yang lain menganggur.</li><li><b>Mengubah <code>balance</code> tanpa reload</b> — di lab ini perubahan baru terasa setelah <code>podman restart haproxy</code> (dan konfigurasimu tervalidasi dulu).</li><li><b>Menonaktifkan <code>check</code> demi distribusi rapi</b> — tanpa health check, request jatuh ke server mati dan hasil &quot;distribusi&quot; justru menyesatkan.</li><li><b>Lupa <code>static-rr</code> mengabaikan perubahan weight saat jalan</b> — timbul kesan &quot;weight saya tidak bekerja&quot; yang sebenarnya sudah didokumentasikan.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Berpindah algoritma seperti ilmuwan, bukan seperti menebak',
      text: '<p>Buat satu baris pengukuran yang konsisten: jalankan <code>sort | uniq -c</code> dari loop 20 request, catat angkanya, lalu ubah <b>satu variabel saja</b> (algoritma, weight, atau mematikan satu backend). Dengan begitu setiap perbedaan angka punya penyebab yang jelas. Kebiasaan mengukur sebelum menyimpulkan ini persis yang akan kamu pakai lagi di pelajaran benchmark dan tuning.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['roundrobin', 'Request dibagikan bergiliran menurut bobot; dinamis dan paling umum untuk HTTP.'],
        ['leastconn', 'Memilih server dengan koneksi aktif paling sedikit; cocok untuk sesi panjang.'],
        ['static-rr', 'Giliran statis berbasis urutan dan bobot; perubahan weight saat jalan baru berlaku setelah reload.'],
        ['source', 'Hash IP client untuk memilih server — menentukan tapi rawan terhadap NAT.'],
        ['weight', 'Angka bobot per server yang menentukan lebar porsi traffic pada algoritma yang mendukungnya.'],
        ['Pool backend', 'Kumpulan server dalam satu <code>backend</code> yang siap menerima traffic dari frontend.'],
        ['Keep-alive', 'Satu koneksi TCP dipakai untuk banyak request; membuat jumlah koneksi berbeda dari jumlah request.'],
        ['NAT', 'Network Address Translation — banyak IP privat berubah jadi satu IP publik, mengaburkan identitas asli client.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Jalankan lab tiga backend sampai <code>curl -s http://localhost:8080</code> bergantian menampilkan <code>web1</code>, <code>web2</code>, dan <code>web3</code>, lalu buktikan dengan output <code>sort | uniq -c</code>.</li><li>Ubah <code>balance</code> ke <code>leastconn</code>, <code>static-rr</code>, dan <code>source</code>; catat hitungan tiap algoritma dalam satu tabel dan jelaskan perbedaannya, termasuk apa yang terjadi bila semua client datang dari IP yang sama.</li><li>Terapkan weight <code>5 : 2 : 1</code>, uji 20 request, lalu hitung berapa persen porsi yang benar-benar diterima web1 — bandingkan dengan rasio idealnya.</li><li><b>Checkpoint:</b> mampu memilih algoritma sesuai karakteristik workload dan menjelaskan kenapa distribusi tidak pernah persis rata dengan menyebut tiga penyebab berbeda.</li></ol>'
    }
  ],
  recap: [
    'Tiga backend dengan <b>halaman identitas berbeda</b> membuat distribusi traffic bisa dibuktikan, bukan sekadar diyakini.',
    'Empat algoritma utama: <b>roundrobin</b> (giliran), <b>leastconn</b> (paling sepi), <b>static-rr</b> (giliran statis), <b>source</b> (hash IP) — pilihan bergantung pada durasi request dan kebutuhan konsistensi.',
    '<b>Weight</b> menyesuaikan porsi traffic per server, paling terasa pada roundrobin dan static-rr.',
    'Distribusi tidak pernah persis rata karena pembulatan giliran, perbedaan bobot, health check, sifat dinamis roundrobin, keep-alive, dan NAT — <b>itu perilaku wajar, bukan bug</b>.'
  ]
});
