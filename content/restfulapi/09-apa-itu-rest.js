/* ============================================================
   Pelajaran Dasar RESTful API — Bab 9: Apa Itu REST?
   ============================================================ */
'use strict';

window.RESTFULAPI_LESSONS = window.RESTFULAPI_LESSONS || [];

window.RESTFULAPI_LESSONS.push({
  id: 'apa-itu-rest',
  title: 'Apa Itu REST? 6 Prinsipnya dengan Bahasa Sederhana',
  chapter: 'Konsep REST',
  duration: '10 menit',
  intro: [
    'Pernahkah kamu heran karena banyak aplikasi terasa "sama rasanya" saat dipakai? API yang enak biasanya mengikuti satu panduan merancang bernama <b>REST</b>. Panduan inilah yang membuat pemanggil API bisa menebak tanpa banyak bertanya.',
    '<b>REST</b> bukan program yang kamu pasang, bukan pula protokol seperti HTTP. Ia kumpulan prinsip agar API mudah ditebak. Pelajaran ini membedah enam prinsip REST dengan bahasa sehari-hari.'
  ],
  objectives: [
    'Menjelaskan apa itu REST dengan bahasa sendiri',
    'Menyebutkan enam prinsip REST beserta arti awamnya',
    'Memberi contoh penerapan prinsip stateless dari aplikasi ojek online',
    'Membedakan API biasa dengan API yang disebut RESTful'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Apa Itu REST?</h3><p><b>REST</b> adalah kependekan dari <i>Representational State Transfer</i>. Gaya merancang API ini diperkenalkan seorang peneliti bernama <b>Roy Fielding</b> pada tahun <b>2000</b>.</p><p>Padanan bebasnya: cara memindahkan data antar program secara tertata. REST bukan program, bukan server, dan bukan bahasa pemrograman. Ia hanya <b>aturan main</b> supaya API mudah ditebak banyak orang.</p><blockquote style="border-left:3px solid var(--accent);padding-left:12px;margin:12px 0"><b>REST = papan nama toko.</b> Toko yang bagus punya papan jelas: nama, jam buka, dan menu. Pengunjung baru langsung paham tanpa bertanya satu per satu.</blockquote><p>API yang mengikuti prinsip REST terasa seperti toko berpapan nama jelas. Kamu cukup belajar sekali, lalu bisa menebak alamat lain.</p>'
    },
    {
      type: 'text',
      html: '<h3>Prinsip 1 &amp; 2: Client–Server dan Stateless</h3><p><b>Client–Server</b> berarti yang minta dan yang melayani dipisah. Aplikasi di HP-mu (klien) bicara dengan komputer penyimpan data (server). Karena dipisah, keduanya bisa berkembang sendiri tanpa mengganggu yang lain.</p><p><b>Stateless</b> berarti server tidak mengingat kamu antar permintaan. Analoginya pergi ke bank: setiap kali datang, kamu <b>bawa KTP</b>. Satpam tidak perlu menghafal wajahmu.</p><p>Di dunia API, "KTP" itu biasanya berupa token login yang disertakan di tiap request. Jadi setiap request berdiri sendiri dan membawa identitasnya sendiri.</p>'
    },
    {
      type: 'example',
      title: 'Contoh stateless: aplikasi ojek online',
      lang: 'text',
      output: false,
      code: `Aplikasi ojek (klien)
   │ request 1: GET /api/v1/orders/88
   │            + Authorization: Bearer token-budi
   ▼
Server pesanan
   │ "siapa pemesannya? baca token di request ini" → Budi
   ▼
response: 200 OK + detail pesanan Budi

--- 5 menit kemudian ---

Aplikasi ojek (klien)
   │ request 2: GET /api/v1/drivers/nearby
   │            + Authorization: Bearer token-budi
   ▼
Server driver
   │ "siapa pemesannya? baca token di request ini" → tetap Budi`,
      explain: [
        'Identitas dibawa <b>tiap request</b> lewat token, bukan disimpan di ingatan server.',
        'Server tidak menyimpan "sesi Budi". Kalau lupa, ia tinggal membaca token yang dibawa request.',
        'Karena itu server bisa melayani jutaan orang tanpa menghafal satu per satu.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Prinsip 3 &amp; 4: Cacheable dan Uniform Interface</h3><p><b>Cacheable</b> berarti jawaban server boleh disimpan sementara agar permintaan berikutnya lebih cepat. Analoginya etalase toko: gambar produk dipajang di etalase dulu, bukan diambil dari gudang tiap ada pengunjung.</p><p>Contohnya foto produk di aplikasi belanja. Saat kamu buka aplikasi kedua kali, foto tidak selalu diunduh ulang. Versi simpanan sementara (cache) dipakai dulu.</p><p><b>Uniform Interface</b> berarti semua resource memakai aturan main yang sama. Path berisi nama resource, method menentukan aksi, jawaban berupa JSON. Cukup belajar sekali, kamu bisa menebak endpoint lain.</p>'
    },
    {
      type: 'example',
      title: 'Bandingkan: API susah ditebak vs mudah ditebak',
      lang: 'text',
      output: false,
      code: `# API yang aturannya beda-beda (susah ditebak)
GET    /getProducts
POST   /addNewProduct
GET    /deleteProduct?id=3
POST   /product/update

# API dengan aturan seragam (mudah ditebak)
GET    /api/v1/products
POST   /api/v1/products
PUT    /api/v1/products/3
DELETE /api/v1/products/3`,
      explain: [
        'Di blok pertama, kamu harus menebak nama tiap "tombol" satu per satu.',
        'Di blok kedua, polanya sama terus: <b>path = siapa yang diaksi, method = aksinya</b>. Inilah uniform interface.',
        'Blok kedua akan kamu rancang sendiri di pelajaran merancang endpoint.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Prinsip 5 &amp; 6: Layered System dan Code on Demand</h3><p><b>Layered System</b> berarti di balik layar ada banyak lapisan. Bisa ada proxy (perantara) atau gateway (gerbang) yang membantu meneruskan dan mengamankan request. Bagi pengguna, semua itu tak terlihat; yang penting jawaban tetap sampai dengan baik.</p><p><b>Code on Demand</b> bersifat opsional. Server boleh mengirim tambahan kode ke klien, misalnya berkas JavaScript agar tampilan lebih kaya. Prinsip ini jarang dipakai API biasa, jadi cukup kamu kenal saja.</p><p>API yang taat pada prinsip-prinsip di atas disebut <b>API RESTful</b>. Jadi "RESTful" bukan gelar resmi, melainkan penilaian: seberapa taat API itu pada prinsip REST.</p><table><thead><tr><th>Prinsip</th><th>Arti awam</th></tr></thead><tbody><tr><td><b>Client–Server</b></td><td>Yang minta dan yang melayani dipisah.</td></tr><tr><td><b>Stateless</b></td><td>Server tidak mengingatmu; tiap request bawa identitas sendiri.</td></tr><tr><td><b>Cacheable</b></td><td>Jawaban boleh disimpan sementara agar cepat.</td></tr><tr><td><b>Uniform Interface</b></td><td>Aturan main sama untuk semua resource.</td></tr><tr><td><b>Layered System</b></td><td>Banyak lapisan tak terlihat di balik layar.</td></tr><tr><td><b>Code on Demand</b></td><td>Opsional: server boleh mengirim kode tambahan.</td></tr></tbody></table>'
    },
    {
      type: 'tip',
      title: 'Uji cepat: apakah endpoint-nya mudah ditebak?',
      text: 'Tanyakan tiga hal saat melihat sebuah API. Satu: apakah path-nya berupa nama benda seperti <code>/products</code>? Dua: apakah aksinya dibawa method, bukan ditulis di path? Tiga: apakah kamu bisa menebak endpoint lain tanpa bertanya? Kalau jawabannya ya, API itu layak disebut <b>RESTful</b>.'
    },
    {
      type: 'live',
      title: 'Latihan: kuis cocokkan 6 prinsip REST',
      lang: 'html',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Kuis Prinsip REST</title>
<style>
  body { font-family: system-ui, sans-serif; font-size: 14px; margin: 12px; color: #1f2937; }
  h2 { margin: 0 0 4px; font-size: 17px; color: #2563eb; }
  .ket { color: #6b7280; font-size: 13px; margin-bottom: 12px; }
  .kartu { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-bottom: 12px; }
  .penjelasan { font-size: 14px; line-height: 1.5; margin: 6px 0 0; }
  .skor { font-weight: 700; margin-bottom: 8px; }
  .pilih { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
  .pilih button { border: 1px solid #cbd5e1; background: #fff; border-radius: 8px; padding: 8px 12px; font-size: 13px; cursor: pointer; }
  .pilih button:hover { border-color: #2563eb; }
  .pilih button.benar { background: #dcfce7; border-color: #16a34a; color: #14532d; font-weight: 700; }
  .pilih button.salah { background: #fee2e2; border-color: #dc2626; color: #7f1d1d; }
  .pilih button.dimatikan { opacity: .45; cursor: not-allowed; }
  .umpan { border-radius: 8px; padding: 10px 12px; font-size: 13px; line-height: 1.5; display: none; }
  .umpan.tampil { display: block; }
  .umpan.ok { background: #dcfce7; color: #14532d; }
  .umpan.no { background: #fee2e2; color: #7f1d1d; }
  .umpan.info { background: #eff6ff; color: #1e3a8a; }
  button.akhir { border: 0; border-radius: 8px; padding: 9px 14px; background: #2563eb; color: #fff; font-weight: 700; cursor: pointer; margin-top: 10px; display: none; }
</style>
</head>
<body>
<h2>Kuis: 6 Prinsip REST</h2>
<div class="ket">Baca penjelasan, lalu klik prinsip yang paling cocok. Tiap soal dinilai benar atau salah.</div>
<div class="skor" id="skor">Skor: 0/6 · Soal: 1/6</div>
<div class="kartu">
  <b>Penjelasan ini milik prinsip apa?</b>
  <p class="penjelasan" id="soal"></p>
</div>
<div class="pilih" id="tombol"></div>
<div class="umpan" id="umpan"></div>
<button class="akhir" id="ulangi">Ulangi kuis</button>
<script>
  var prinsip = [
    { nama: 'Client–Server', jelas: 'Yang minta (klien) dan yang melayani (server) berdiri sendiri, seperti pelanggan dan dapur restoran.' },
    { nama: 'Stateless', jelas: 'Server tidak mengingat kamu; tiap request membawa identitasnya sendiri, seperti tiap kali ke bank selalu bawa KTP.' },
    { nama: 'Cacheable', jelas: 'Jawaban boleh disimpan sementara agar permintaan berikutnya lebih cepat, seperti etalase toko.' },
    { nama: 'Uniform Interface', jelas: 'Semua resource memakai aturan main yang sama: path berisi nama resource, method berisi aksi.' },
    { nama: 'Layered System', jelas: 'Di balik layar ada banyak lapisan seperti proxy dan gateway, tapi pengguna tidak merasakannya.' },
    { nama: 'Code on Demand', jelas: 'Prinsip opsional: server boleh mengirim tambahan kode, misalnya berkas JavaScript, ke klien.' }
  ];
  var antre = [], posisi = 0, skor = 0, terjawab = false, selesai = false;

  function acak() {
    antre = [0, 1, 2, 3, 4, 5];
    for (var i = antre.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = antre[i]; antre[i] = antre[j]; antre[j] = t;
    }
    posisi = 0; skor = 0; terjawab = false; selesai = false;
  }

  function buatTombol() {
    var wadah = document.getElementById('tombol');
    wadah.innerHTML = '';
    for (var i = 0; i < prinsip.length; i++) {
      var b = document.createElement('button');
      b.textContent = prinsip[i].nama;
      b.setAttribute('data-i', i);
      b.onclick = function () { periksa(parseInt(this.getAttribute('data-i'), 10), this); };
      wadah.appendChild(b);
    }
  }

  function segarkanTombol(aktif) {
    var semua = document.getElementById('tombol').getElementsByTagName('button');
    for (var i = 0; i < semua.length; i++) {
      semua[i].className = aktif ? 'dimatikan' : '';
    }
  }

  function tampilkanSoal() {
    document.getElementById('soal').textContent = prinsip[antre[posisi]].jelas;
    var u = document.getElementById('umpan');
    u.className = 'umpan';
    segarkanTombol(false);
    terjawab = false;
    document.getElementById('skor').textContent = 'Skor: ' + skor + '/6 · Soal: ' + (posisi + 1) + '/6';
  }

  function periksa(kunci, tombol) {
    if (terjawab || selesai) return;
    terjawab = true;
    var benar = antre[posisi];
    var u = document.getElementById('umpan');
    if (kunci === benar) {
      skor++;
      tombol.className = 'benar';
      u.className = 'umpan tampil ok';
      u.textContent = 'Benar! ' + prinsip[benar].nama + ' — ' + prinsip[benar].jelas;
    } else {
      tombol.className = 'salah';
      var semua = document.getElementById('tombol').getElementsByTagName('button');
      semua[benar].className = 'benar';
      u.className = 'umpan tampil no';
      u.textContent = 'Kurang tepat. Yang benar: ' + prinsip[benar].nama + ' — ' + prinsip[benar].jelas;
    }
    document.getElementById('skor').textContent = 'Skor: ' + skor + '/6 · Soal: ' + (posisi + 1) + '/6';
    setTimeout(function () {
      posisi++;
      if (posisi >= 6) {
        selesai = true;
        var s = document.getElementById('skor');
        s.textContent = 'Selesai! Skor akhir: ' + skor + '/6';
        u.className = 'umpan tampil info';
        if (skor === 6) {
          u.textContent = 'Sempurna! Semua prinsip sudah kamu kenali. Ingat: enam prinsip ini yang membuat API disebut RESTful.';
        } else {
          u.textContent = 'Teruskan! Baca lagi pelajarannya, lalu ulangi kuis sampai skor 6/6.';
        }
        document.getElementById('ulangi').style.display = 'inline-block';
      } else {
        tampilkanSoal();
      }
    }, 1900);
  }

  document.getElementById('ulangi').onclick = function () {
    this.style.display = 'none';
    acak();
    buatTombol();
    tampilkanSoal();
  };

  acak();
  buatTombol();
  tampilkanSoal();
</script>
</body>
</html>`,
      hint: 'Klik tombol prinsip yang cocok dengan penjelasan di kartu. Kalau salah, jawaban benar akan disorot. Usahakan skor akhir 6/6.'
    },
    {
      type: 'warn',
      title: 'REST bukan hal yang dipasang',
      text: 'Tidak ada tombol "aktifkan REST" di server mana pun. REST lahir dari keputusan merancang: menamai resource dengan benar, memilih method yang tepat, dan membentuk respons yang tertata. Jadi REST itu <b>kebiasaan baik merancang API</b>, bukan perangkat lunak.'
    },
    {
      type: 'vocab',
      items: [
        ['REST', 'Gaya merancang API agar mudah ditebak; diperkenalkan Roy Fielding tahun 2000.'],
        ['Representational State Transfer', 'Nama panjang REST: cara memindahkan bentuk data antar program secara tertata.'],
        ['Stateless', 'Sifat server yang tidak mengingat pengguna antar request; identitas dibawa tiap request.'],
        ['Cacheable', 'Sifat jawaban yang boleh disimpan sementara agar permintaan berikutnya lebih cepat.'],
        ['Uniform Interface', 'Aturan main yang sama untuk semua resource: path = nama, method = aksi.'],
        ['Layered System', 'Banyak lapisan seperti proxy dan gateway yang bekerja di balik layar.'],
        ['Code on Demand', 'Prinsip opsional: server boleh mengirim tambahan kode kepada klien.'],
        ['API RESTful', 'API yang taat pada prinsip-prinsip REST.']
      ]
    }
  ],
  recap: [
    '<b>REST</b> = gaya merancang API (Roy Fielding, 2000); bukan program dan bukan protokol.',
    'Ada enam prinsip: client–server, stateless, cacheable, uniform interface, layered system, dan code on demand.',
    '<b>Stateless</b> = server tidak mengingatmu; tiap request bawa identitas sendiri, seperti bawa KTP ke bank.',
    '<b>Uniform interface</b> membuat kamu cukup belajar sekali, lalu bisa menebak endpoint lain.',
    'API yang taat prinsip ini disebut <b>API RESTful</b>.'
  ]
});
