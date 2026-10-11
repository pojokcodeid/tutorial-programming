/* ============================================================
   Pelajaran HTML — Bab 3: Data & Formulir (L9–L10)
   ============================================================ */
'use strict';

window.HTML_LESSONS = window.HTML_LESSONS || [];

window.HTML_LESSONS.push({
  id: 'tabel',
  title: 'Tabel',
  chapter: 'Data & Tabel',
  duration: '8 menit',
  intro: [
    'Untuk menampilkan data yang teratur dalam baris dan kolom — seperti jadwal, harga, atau nilai — HTML menyediakan <b>tabel</b>.'
  ],
  objectives: [
    'Membangun tabel dengan &lt;table&gt;, &lt;tr&gt;, &lt;th&gt;, &lt;td&gt;',
    'Memakai &lt;thead&gt;, &lt;tbody&gt;, dan &lt;caption&gt;',
    'Menggabungkan sel dengan colspan dan rowspan'
  ],
  sections: [
    {
      type: 'example',
      title: 'Tabel sederhana',
      lang: 'html',
      output: true,
      code: `<table border="1" cellpadding="8" style="border-collapse:collapse">
  <caption>Jadwal Belajar Pekanan</caption>
  <tr>
    <th>Hari</th>
    <th>Materi</th>
    <th>Durasi</th>
  </tr>
  <tr>
    <td>Senin</td>
    <td>HTML Dasar</td>
    <td>1 jam</td>
  </tr>
  <tr>
    <td>Selasa</td>
    <td>HTML Lanjut</td>
    <td>1,5 jam</td>
  </tr>
</table>`,
      explain: [
        '<b>&lt;table&gt;</b> membungkus seluruh tabel; <b>&lt;caption&gt;</b> memberi judul tabel.',
        '<b>&lt;tr&gt;</b> = satu baris; <b>&lt;th&gt;</b> = sel kepala (tebal & rata tengah); <b>&lt;td&gt;</b> = sel data biasa.',
        'Garis tabel memakai inisialisasi "border" di sini hanya agar mudah terlihat — nanti CSS yang menangani tampilan sungguhan.'
      ]
    },
    {
      type: 'example',
      title: 'Struktur thead/tbody + penggabungan sel',
      lang: 'html',
      output: true,
      code: `<table border="1" cellpadding="8" style="border-collapse:collapse">
  <caption>Daftar Harga</caption>
  <thead>
    <tr>
      <th>Paket</th>
      <th>Harga</th>
      <th colspan="2">Fitur</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Gratis</td>
      <td>Rp0</td>
      <td>10 pelajaran</td>
      <td>-</td>
    </tr>
    <tr>
      <td>Pro</td>
      <td rowspan="2">Rp49rb</td>
      <td>Semua pelajaran</td>
      <td>Kuis harian</td>
    </tr>
    <tr>
      <td>Pro+</td>
      <td>Semua pelajaran</td>
      <td>+ Sertifikat</td>
    </tr>
  </tbody>
</table>`,
      explain: [
        '<b>&lt;thead&gt;</b>/<b>&lt;tbody&gt;</b> mengelompokkan baris kepala dan isi — membantu CSS dan pembaca layar.',
        '<b>colspan="2"</b> menggabungkan 2 kolom secara horizontal.',
        '<b>rowspan="2"</b> menggabungkan 2 baris secara vertikal (sel "Rp49rb" membentang dua baris).'
      ]
    },
    {
      type: 'warn',
      title: 'Jangan salah guna',
      text: 'Tabel itu untuk <b>data</b>, bukan untuk tata letak halaman. Jaman dulu orang memakai tabel untuk menyusun layout, tetapi sekarang itu praktik buruk — gunakan CSS (flexbox/grid) untuk tata letak.'
    },
    {
      type: 'tip',
      title: 'Tambah aksesibilitas',
      text: 'Gunakan <b>&lt;caption&gt;</b> sebagai judul tabel dan atribut <b>scope="col"</b> / <b>scope="row"</b> pada &lt;th&gt; agar pembaca layar memahami hubungan antara kepala dan data.'
    }
  ],
  recap: [
    'Tabel tersusun dari &lt;table&gt; → &lt;tr&gt; (baris) → &lt;th&gt;/&lt;td&gt; (sel).',
    'Gunakan &lt;thead&gt;, &lt;tbody&gt;, &lt;caption&gt; untuk struktur yang jelas.',
    'colspan menggabung kolom, rowspan menggabung baris.'
  ]
});

window.HTML_LESSONS.push({
  id: 'form',
  title: 'Formulir (Form)',
  chapter: 'Formulir',
  duration: '10 menit',
  intro: [
    'Formulir adalah cara pengunjung mengirim data ke kamu: mendaftar, login, mencari, atau mengisi pesan. Di HTML, semua formulir dimulai dengan tag <b>&lt;form&gt;</b> dan berisi berbagai jenis <b>&lt;input&gt;</b>.'
  ],
  objectives: [
    'Membuat formulir dengan &lt;form&gt; dan &lt;input&gt;',
    'Mengenal jenis-jenis input: text, email, password, radio, checkbox, dll',
    'Menghubungkan &lt;label&gt; dengan input',
    'Validasi sederhana dengan atribut required dan placeholder'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Setiap isian harus punya <b>&lt;label&gt;</b> yang dihubungkan lewat atribut <code>for</code> dengan <code>id</code> input. Selain memudahkan pengguna mengklik, ini wajib untuk aksesibilitas.</p>'
    },
    {
      type: 'example',
      title: 'Formulir pendaftaran sederhana',
      lang: 'html',
      output: true,
      code: `<form action="#" method="post">
  <p>
    <label for="nama">Nama lengkap</label><br>
    <input type="text" id="nama" name="nama"
           placeholder="cth: Budi Santoso" required>
  </p>

  <p>
    <label for="email">Email</label><br>
    <input type="email" id="email" name="email"
           placeholder="cth: budi@email.com" required>
  </p>

  <p>
    <label for="pass">Kata sandi</label><br>
    <input type="password" id="pass" name="pass" required>
  </p>

  <p>
    <label>Jenis kelamin</label><br>
    <input type="radio" id="lk" name="jk" value="L" checked>
    <label for="lk">Laki-laki</label><br>
    <input type="radio" id="pr" name="jk" value="P">
    <label for="pr">Perempuan</label>
  </p>

  <p>
    <input type="checkbox" id="syarat" name="syarat" required>
    <label for="syarat">Saya setuju dengan syarat &amp; ketentuan</label>
  </p>

  <p>
    <label for="pesan">Pesan (textarea)</label><br>
    <textarea id="pesan" name="pesan" rows="3" cols="30"
              placeholder="Tulis pesanmu…"></textarea>
  </p>

  <p>
    <label for="level">Tingkat (select)</label><br>
    <select id="level" name="level">
      <option>Pemula</option>
      <option>Menengah</option>
      <option>Mahir</option>
    </select>
  </p>

  <button type="submit">Daftar Sekarang</button>
</form>`,
      explain: [
        '<b>&lt;input type="text|email|password"&gt;</b> — jenis isian sesuai kebutuhan.',
        'Atribut <b>placeholder</b> memberi contoh isian; <b>required</b> mewajibkan diisi (validasi otomatis oleh browser).',
        '<b>type="radio"</b> memilih satu dari banyak; <b>type="checkbox"</b> mencentang (boleh banyak).',
        '<b>&lt;textarea&gt;</b> untuk teks panjang; <b>&lt;select&gt;</b> untuk pilihan menurun.',
        '<b>&lt;button type="submit"&gt;</b> mengirim data formulir.'
      ]
    },
    {
      type: 'text',
      html: '<p>Perhatikan cara <code>&lt;label for="nama"&gt;</code> terhubung ke <code>&lt;input id="nama"&gt;</code>. Begitu terhubung, mengklik teks label akan otomatis menfokuskan isiannya.</p><p>Dua atribut praktis yang sering dipakai: <b>minlength/maxlength</b> (batas jumlah karakter) dan <b>pattern</b> (pola regex, mis. untuk nomor HP).</p>'
    },
    {
      type: 'example',
      title: 'Atribut angka & tanggal',
      lang: 'html',
      output: true,
      code: `<form action="#" method="post">
  <p>
    <label for="umur">Umur (number)</label><br>
    <input type="number" id="umur" name="umur"
           min="13" max="100" step="1" value="18">
  </p>
  <p>
    <label for="tgl">Tanggal lahir (date)</label><br>
    <input type="date" id="tgl" name="tgl">
  </p>
  <p>
    <label for="warna">Warna favorit (color)</label><br>
    <input type="color" id="warna" name="warna" value="#4f46e5">
  </p>
  <p>
    <label for="file">Unggah berkas (file)</label><br>
    <input type="file" id="file" name="file">
  </p>
  <button type="submit">Kirim</button>
</form>`,
      explain: [
        '<b>type="number"</b> dengan min/max/step membatasi nilai yang valid.',
        '<b>type="date"</b> menampilkan pemilih tanggal; <b>type="color"</b> pemilih warna.',
        '<b>type="file"</b> untuk mengunggah berkas; <b>type="range"</b> dan <b>type="tel"</b> juga tersedia.'
      ]
    },
    {
      type: 'tip',
      title: 'Di mana data dikirim?',
      text: 'Formulir dikirim ke alamat pada atribut action (mis. file PHP/API). Dalam latihan ini kita memakai action="#" supaya halaman tidak kemana-mana. Pada materi JavaScript nanti kamu bisa memproses formulir tanpa memuat ulang halaman.'
    },
    {
      type: 'live',
      title: 'Latihan: formulir kontak',
      lang: 'html',
      hint: 'Buat form dengan input nama (text), email (email), textarea pesan, dan tombol submit. Semua diberi label yang terhubung dan required.',
      initial: `<h2>Formulir Kontak</h2>
<form action="#" method="post">
  <p>
    <label for="nama">Nama</label><br>
    <input type="text" id="nama" name="nama" placeholder="Nama kamu" required>
  </p>
</form>`
    }
  ],
  recap: [
    '&lt;form&gt; membungkus isian; setiap input punya &lt;label&gt; yang terhubung (for = id).',
    'Jenis input: text, email, password, number, date, color, file, radio, checkbox.',
    'required = wajib diisi; placeholder = contoh isian; button submit = kirim data.'
  ]
});