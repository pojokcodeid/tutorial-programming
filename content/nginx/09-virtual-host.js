/* ============================================================
   Pelajaran Nginx — 09: Virtual Host: Banyak Domain dalam Satu Nginx
   ============================================================ */
'use strict';

window.NGINX_LESSONS = window.NGINX_LESSONS || [];

window.NGINX_LESSONS.push({
  id: 'virtual-host',
  title: 'Virtual Host: Banyak Domain dalam Satu Nginx',
  chapter: 'Virtual Host',
  duration: '10 menit',
  intro: [
    'Bayangkan satu ruko berisi tiga toko: <i>Kopi Senja</i>, <i>Toko Buku</i>, dan <i>Servis HP</i>. Alamatnya sama — Jl. Merdeka No. 10 — tetapi begitu kamu menyebut nama tokonya, satpam mengarahkanmu ke unit yang benar. <b>Satu gedung bisa memuat banyak nama toko</b>, dan begitu pula satu Nginx.',
    'Di HTTP, sebutan nama di pintu itu bernama <b>Host header</b>. Pelajaran ini membedah cara Nginx memilih blok <code>server</code>, bentuk-bentuk <code>server_name</code> (exact, wildcard, regex), default server, lalu memasang beberapa domain sekaligus di satu container dan mengujinya <b>tanpa DNS sungguhan</b>.'
  ],
  objectives: [
    'Menjelaskan cara Nginx memilih blok server lewat Host header',
    'Menulis beberapa virtual host (server_name) dalam satu Nginx dan mengatur default server',
    'Memakai wildcard dan regex pada server_name dengan urutan prioritas yang benar',
    'Memisahkan konfigurasi per domain lalu menguji tanpa DNS sungguhan'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Satu gedung, banyak nama toko</h3><p>Satu ruko memuat tiga toko dengan alamat yang sama. Pembedanya bukan gedungnya, melainkan <b>sebutan nama yang kamu ucapkan di pintu</b>. Di dunia web polanya persis: satu proses Nginx, satu port, satu IP — tapi banyak nama domain dilayani dari situ.</p><table><thead><tr><th>Di ruko</th><th>Di dunia web</th></tr></thead><tbody><tr><td>Satu gedung</td><td>Satu proses Nginx di satu port dan satu IP</td></tr><tr><td>Nama toko di pintu</td><td><code>server_name</code> (mis. <code>app.local</code>)</td></tr><tr><td>Sebutan tamu ke satpam</td><td>Header <code>Host:</code> pada request</td></tr><tr><td>Unit yang dituju</td><td>Blok <code>server</code> yang cocok</td></tr><tr><td>Tamu yang tidak dikenal</td><td>Blok <b>default server</b></td></tr></tbody></table><p>Konsep ini disebut <b>virtual host</b>: satu blok <code>server { ... }</code> mewakili satu nama domain. Banyak blok hidup berdampingan tanpa saling berebut port.</p>'
    },
    {
      type: 'example',
      title: 'Satu port, empat wajah',
      lang: 'text',
      output: false,
      code: `       Host: app.local        Host: api.local       Host: docs.local
              |                      |                      |
              v                      v                      v
     +--------------------------------------------------------------+
     |  Nginx - satu proses, satu port 80, satu IP                  |
     |  server { server_name app.local; }  -> halaman aplikasi      |
     |  server { server_name api.local; }  -> endpoint API          |
     |  server { server_name docs.local; } -> halaman dokumentasi   |
     |  default_server                      -> tamu tak dikenal     |
     +--------------------------------------------------------------+`,
      explain: [
        'Tiga request berbeda hanya dibedakan oleh isi header <code>Host</code>, bukan oleh IP maupun port — ketiganya masuk lewat satu pintu yang sama.',
        'Setiap baris <code>server { ... }</code> adalah satu virtual host; semuanya aktif bersamaan di port 80.',
        'Blok bertanda <code>default_server</code> menampung request yang <code>server_name</code>-nya tidak cocok dengan blok mana pun — buktikan dengan <code>curl -H &#39;Host: asal.local&#39; http://localhost:8080</code>.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Dua langkah pemilihan server</h3><p>Nginx memilih blok <code>server</code> hanya dengan dua langkah:</p><ol><li>Cocokkan <b>Host header</b> dengan <code>server_name</code> pada blok-blok di port tersebut.</li><li>Kalau tidak ada yang cocok, pakai <b>default server</b> port itu.</li></ol><p>Default server ditandai dengan <code>default_server</code> pada baris <code>listen</code>. Tanpa tanda itu, <b>blok pertama yang didefinisikan</b> untuk port tersebut otomatis jadi default — inilah sebabnya konfigurasi per domain diberi nama <code>00-default.conf</code> agar terbaca paling awal.</p><p>Dari mana Host header datang? Membuka <code>http://app.local/</code> membuat browser mengirim <code>Host: app.local</code>, sedangkan <code>curl http://localhost:8080</code> mengirim <code>Host: localhost:8080</code>. Karena itu di lab cukup <b>memalsukan Host</b> dengan <code>curl -H &#39;Host: ...&#39;</code> tanpa perlu mengurus DNS.</p><blockquote style="border-left:3px solid var(--accent);padding-left:12px;margin:12px 0"><code>server_name</code> <b>bukan</b> pengarah ke mesin — itu pekerjaan DNS. <code>server_name</code> hanya berarti: &quot;jika klien menyebut nama ini, pakai blok saya.&quot;</blockquote>'
    },
    {
      type: 'text',
      html: '<h3>Enam bentuk server_name</h3><p>Directive <code>server_name</code> menerima beberapa pola. Kuasai tabel ini dan hampir semua konfigurasi virtual host bisa kamu baca:</p><table><thead><tr><th>Bentuk</th><th>Contoh</th><th>Cocok untuk</th></tr></thead><tbody><tr><td>Exact</td><td><code>server_name app.local;</code></td><td>Hanya <code>app.local</code></td></tr><tr><td>Wildcard subdomain</td><td><code>server_name *.example.com;</code></td><td><code>www.example.com</code> — tetapi <b>bukan</b> <code>example.com</code></td></tr><tr><td>Wildcard lama</td><td><code>server_name .example.com;</code></td><td><code>example.com</code> + <code>www.example.com</code> (gaya lama)</td></tr><tr><td>Regex</td><td><code>server_name ~^docs-\\d+\\.local$;</code></td><td>Pola nama; <b>wajib</b> diawali <code>~</code></td></tr><tr><td>Banyak nama</td><td><code>server_name app.local www.app.local;</code></td><td>Beberapa nama dalam satu blok</td></tr><tr><td>Catch-all</td><td><code>server_name _;</code></td><td>Penanda saja — yang bekerja tetap <code>default_server</code></td></tr></tbody></table><p>Bila beberapa blok sama-sama cocok, urutan prioritasnya: <b>exact &gt; wildcard &gt; regex</b>, dan regex dievaluasi menurut urutan definisi. Regex lain yang berguna: <code>server_name ~^v[0-9]+\\.app\\.local$;</code> untuk melayani <code>v1.app.local</code>, <code>v2.app.local</code>, dst.</p>'
    },
    {
      type: 'text',
      html: '<h3>DNS vs server_name: dua hal yang sering tertukar</h3><p>Alurnya berurutan: nama <code>app.local</code> diubah DNS (atau <code>/etc/hosts</code>) menjadi IP, klien terhubung ke IP itu port 80, dan <b>baru</b> di sana Host header dipakai memilih blok <code>server</code>.</p><table><thead><tr><th></th><th>DNS</th><th><code>server_name</code></th></tr></thead><tbody><tr><td><b>Fungsi</b></td><td>Mengubah nama menjadi IP</td><td>Memilih blok <code>server</code></td></tr><tr><td><b>Dikelola di</b></td><td>Registrar / <code>/etc/hosts</code> / cluster DNS</td><td>File konfigurasi Nginx</td></tr><tr><td><b>Kalau salah</b></td><td>Klien tidak tahu ke mana connect</td><td>Sampai, tapi mendapat halaman default server</td></tr></tbody></table><p>Untuk produksi: pasang A record atau CNAME ke IP Nginx, lalu pastikan <code>server_name</code> sama persis dengan nama record itu. Untuk lab: cukup <code>curl -H &#39;Host: ...&#39;</code>.</p><h4>Pemisahan konfigurasi per domain</h4><p>Jangan menumpuk semua domain di satu file. Pola yang sehat:</p><ul><li><code>conf.d/00-default.conf</code> — alfabetis paling awal, otomatis jadi default server.</li><li><code>conf.d/app.conf</code> — <code>app.local</code></li><li><code>conf.d/api.conf</code> — <code>api.local</code></li><li><code>conf.d/docs.conf</code> — wildcard <code>*.docs.local</code></li></ul>'
    },
    {
      type: 'example',
      title: 'Contoh konfigurasi: empat virtual host',
      lang: 'nginx',
      output: false,
      code: `# conf.d/00-default.conf — blok pertama utk port 80 = default server
server {
    listen 80 default_server;
    server_name _;
    location / { return 444; }   # tutup koneksi tanpa response
}

# conf.d/app.conf
server {
    listen 80;
    server_name app.local www.app.local;
    root /usr/share/nginx/html/app;
}

# conf.d/api.conf
server {
    listen 80;
    server_name api.local;
    location / { return 200 "api.local - endpoint service"; }
}

# conf.d/docs.conf — wildcard subdomain
server {
    listen 80;
    server_name *.docs.local;
    root /usr/share/nginx/html/docs;
}`,
      explain: [
        '<code>listen 80 default_server</code> menjadikan blok ini penerima request yang <code>server_name</code>-nya tidak cocok; <code>return 444</code> menutup koneksi tanpa membalas body sama sekali.',
        '<code>server_name app.local www.app.local;</code> melayani dua nama dalam satu blok; <code>server_name *.docs.local;</code> menangkap satu label saja — <code>a.docs.local</code> cocok, sedangkan <code>a.b.docs.local</code> tidak.',
        '<code>server_name _;</code> hanyalah nama dummy; yang benar-benar bekerja adalah <code>default_server</code> pada baris <code>listen</code>.',
        'Verifikasi tiap blok: <code>podman exec nginx-lab nginx -t</code> harus <code>test is successful</code>, lalu uji dengan <code>curl -H &#39;Host: api.local&#39; http://localhost:8080</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Lab: memasang empat virtual host',
      lang: 'bash',
      output: false,
      code: `mkdir -p nginx-vhost/conf.d
cat > nginx-vhost/conf.d/sites.conf <<'EOF'
server {
    listen 80 default_server;
    server_name _;
    location / { return 200 "DEFAULT - server block tidak dikenal"; }
}
server {
    listen 80;
    server_name app.local www.app.local;
    location / { return 200 "APP - halaman utama aplikasi"; }
}
server {
    listen 80;
    server_name api.local;
    location / { return 200 "API - endpoint service"; }
}
server {
    listen 80;
    server_name *.docs.local;
    location / { return 200 "DOCS - dokumentasi"; }
}
EOF

podman run -d --name nginx-lab -p 8080:80 \\
  -v "$PWD/nginx-vhost/conf.d:/etc/nginx/conf.d:ro" \\
  docker.io/library/nginx:alpine
podman exec nginx-lab nginx -t`,
      explain: [
        'Heredoc <code>&lt;&lt;&#39;EOF&#39;</code> menulis isi blok <code>server</code> apa adanya ke <code>nginx-vhost/conf.d/sites.conf</code>, termasuk tanda kutip dan <code>$</code> di dalamnya.',
        '<code>-v "$PWD/nginx-vhost/conf.d:/etc/nginx/conf.d:ro"</code> menindih folder konfigurasi bawaan image; pastikan foldernya sudah dibuat <code>mkdir -p</code> sebelum container start.',
        'Ekspektasi <code>nginx -t</code>: <code>syntax is ok</code> lalu <code>test is successful</code>. Kalau gagal, pesan error menunjuk file dan baris yang salah.'
      ]
    },
    {
      type: 'example',
      title: 'Lab uji: Host header menentukan jawaban',
      lang: 'bash',
      output: false,
      code: `curl -H 'Host: app.local'     http://localhost:8080   # APP - halaman utama aplikasi
curl -H 'Host: api.local'     http://localhost:8080   # API - endpoint service
curl -H 'Host: v1.docs.local' http://localhost:8080   # DOCS - dokumentasi (wildcard)
curl -H 'Host: asal.local'    http://localhost:8080   # DEFAULT - tidak dikenal
curl                          http://localhost:8080   # DEFAULT (Host: localhost)

podman logs nginx-lab 2>&1 | tail -3
podman rm -f nginx-lab`,
      explain: [
        'Empat baris pertama membuktikan pemilihan blok: nama yang cocok mengembalikan isinya sendiri, nama asing jatuh ke default server, dan curl tanpa <code>-H</code> mengirim <code>Host: localhost:8080</code> sehingga juga kena default.',
        '<code>v1.docs.local</code> terlayani DOCS karena wildcard <code>*.docs.local</code> menangkap tepat satu label subdomain.',
        '<code>podman logs nginx-lab 2>&1 | tail -3</code> menampilkan baris akses log per request: IP, waktu, <code>GET /</code>, status <code>200</code> — bukti server mana yang melayani.'
      ]
    },
    {
      type: 'warn',
      title: 'Kesalahan umum virtual host',
      text: '<ul><li><b>Menyamakan <code>server_name</code> dengan DNS</b> — <code>server_name app.local</code> tidak mengarahkan <code>app.local</code> ke mesin ini; tetap butuh A record atau <code>/etc/hosts</code>.</li><li><b>Lupa <code>default_server</code></b> lalu bingung request aneh jatuh ke blok pertama — tandai secara eksplisit.</li><li><b>Mengira <code>*.example.com</code> mencakup apex</b> — <code>example.com</code> sendiri tidak cocok; tulis <code>server_name example.com www.example.com;</code>.</li><li><b>Regex tanpa <code>~</code></b> — <code>server_name ^www.x.com;</code> tidak valid; wajib <code>server_name ~^www\\.x\\.com$;</code>.</li><li><b>Menguji lewat browser lalu mengira konfigurasi salah</b> — browser mengirim Host asli miliknya; pakai <code>curl -H &#39;Host: ...&#39;</code>.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Uji virtual host tanpa menyentuh DNS',
      text: '<p>Selama lab, jangan repot mengedit <code>/etc/hosts</code>. Cukup satu flag: <code>curl -H &#39;Host: app.local&#39; http://localhost:8080</code> mengirim nama apa pun yang kamu mau ke Nginx. Tambahkan <code>-i</code> bila ingin melihat status code sekaligus. Ini cara tercepat membedakan &quot;konfigurasi salah&quot; dengan &quot;DNS belum menunjuk ke sini&quot; — dua masalah yang gejalanya sama persis.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Virtual host', 'Satu blok server untuk satu nama domain di satu IP/port.'],
        ['server_name', 'Daftar nama yang dicocokkan dengan Host header.'],
        ['Host header', 'Header HTTP berisi nama domain yang diminta klien.'],
        ['Default server', 'Blok penerima request yang server_name-nya tidak cocok.'],
        ['Wildcard', 'Pola *.domain untuk melayani banyak subdomain sekaligus.'],
        ['Regex server_name', 'server_name berpola regex, wajib diawali tanda ~.'],
        ['DNS', 'Layanan yang mengubah nama domain menjadi alamat IP.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Tambahkan virtual host <code>shop.local</code> yang menjawab <code>SHOP - toko online</code>, lalu buktikan dengan curl dan pastikan blok lain tidak berubah.</li><li>Jelaskan kenapa <code>curl http://localhost:8080</code> tanpa <code>-H</code> di lab ini menjawab DEFAULT, bukan APP.</li><li>Buat <code>server_name ~^v[0-9]+\\.app\\.local$;</code>, lalu buktikan <code>v2.app.local</code> terlayani sedangkan <code>beta.app.local</code> jatuh ke default server.</li></ol>'
    }
  ],
  recap: [
    'Satu blok <code>server</code> = satu <b>virtual host</b>; banyak blok hidup di satu Nginx, satu port, dan satu IP.',
    'Pemilihan blok didasarkan <b>Host header → server_name</b>, bukan DNS; tidak ada yang cocok → <b>default server</b>.',
    '<code>server_name</code> mendukung exact, <b>wildcard</b>, dan <b>regex</b> (wajib <code>~^...$</code>), dengan prioritas exact &gt; wildcard &gt; regex.',
    '<b>DNS = nama → IP</b>, sedangkan <code>server_name</code> = memilih blok; konfigurasi sehat dipisah per domain di <code>conf.d/</code>.'
  ]
});
