/* ============================================================
   Pelajaran Contoh Fullstack Microservices — Bab 10: Frontend React + Ant Design
   ============================================================ */
'use strict';

window.FULLSTACK_LESSONS = window.FULLSTACK_LESSONS || [];

window.FULLSTACK_LESSONS.push({
  id: 'fs-frontend-react',
  title: 'Frontend React & Ant Design: Satu Wajah untuk Tiga Service',
  chapter: 'Frontend',
  duration: '16 menit',
  intro: [
    'Backend TokoKita kini lengkap: katalog, pesanan, dan notifikasi masing-masing berdiri sendiri dengan database sendiri. Tugas bab ini adalah memberi mereka <b>satu wajah</b> — aplikasi React dengan Ant Design yang menyatukan tiga service seolah satu aplikasi tunggal, lengkap dengan form, tabel, modal konfirmasi, dan lonceng notifikasi.',
    'Kita tidak akan menulis komponen dari nol. Setiap halaman mengikuti satu <b>pola yang sama</b> — state, fungsi muat, efek samping dengan pembersihan, lalu render komponen Ant Design — sehingga setelah memahami halaman Produk, kamu bisa membaca tiga halaman lainnya dalam hitungan detik.',
    'Di akhir bab antarmuka sudah siap dipakai: navbar dengan menu, tabel produk yang bisa ditambah-diubah-dihapus, form pembuatan pesanan, daftar notifikasi dengan tandai-baca, dan angka lonceng yang diperbarui sendiri tiap lima detik.'
  ],
  objectives: [
    'Menyusun kerangka aplikasi React: Vite, React Router, ConfigProvider berbahasa Indonesia, dan layout Ant Design',
    'Menerapkan pola halaman konsisten: state, fungsi muat, useEffect dengan bendera hidup, dan muat-ulang setelah mutasi',
    'Menghubungkan komponen ke backend lewat lapisan API axios (baseURL /api) tanpa URL absolut di dalam komponen',
    'Menggunakan komponen Ant Design (Table, Form, Modal, Popconfirm, List, Badge) beserta pola validasi form-nya',
    'Menggabungkan data dari tiga service dalam satu layar dengan Promise.all (fan-in)',
    'Menampilkan sentuhan lokal: format rupiah dan antarmuka berbahasa Indonesia'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Peta Aplikasi: Dari Rute ke Komponen</h3><p>Aplikasi ini adalah <b>SPA</b> (Single Page Application): satu file HTML, semua halaman digambar oleh JavaScript di browser. React Router bertugas memetakan URL ke komponen halaman, sedangkan Ant Design menyediakan komponen siap pakai — kamu hampir tidak menulis CSS sama sekali.</p><p>Strukturnya berlapis: pembungkus global di <code>main.jsx</code>, daftar rute di <code>App.jsx</code>, kerangka layout di <code>AppShell.jsx</code>, lalu empat halaman di folder <code>pages/</code>. Lapisan API berdiri terpisah di folder <code>api/</code> — komponen tidak pernah tahu alamat maupun port service.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 405" width="760" role="img" aria-label="Struktur aplikasi frontend: main.jsx membingkai App dengan ConfigProvider dan Router, App menampilkan AppShell dengan empat halaman yang semuanya memanggil lapisan API">
        <defs><marker id="mk-fs10-1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#94a3b8"/></marker></defs>
        <rect x="230" y="15" width="300" height="54" rx="8" class="u-hd"/>
        <text x="380" y="38" class="u-title">main.jsx</text>
        <text x="380" y="58" class="u-lbl" text-anchor="middle">ConfigProvider (id_ID) → AntApp → BrowserRouter</text>
        <line x1="380" y1="69" x2="380" y2="92" class="u-line" marker-end="url(#mk-fs10-1)"/>
        <rect x="230" y="96" width="300" height="56" rx="8" class="u-box"/>
        <text x="380" y="119" class="u-title">App.jsx — &lt;Routes&gt;</text>
        <text x="380" y="139" class="u-lbl" text-anchor="middle">/ → /products · /dashboard · /orders · /notifications</text>
        <line x1="380" y1="152" x2="380" y2="178" class="u-line" marker-end="url(#mk-fs10-1)"/>
        <rect x="15" y="182" width="730" height="52" rx="8" class="u-box"/>
        <text x="380" y="205" class="u-title">AppShell — Layout Ant Design</text>
        <text x="380" y="223" class="u-lbl" text-anchor="middle">Sider + menu + lonceng Badge · Content menggambar &lt;Outlet/&gt;</text>
        <line x1="97" y1="234" x2="97" y2="256" class="u-line" marker-end="url(#mk-fs10-1)"/>
        <line x1="282" y1="234" x2="282" y2="256" class="u-line" marker-end="url(#mk-fs10-1)"/>
        <line x1="477" y1="234" x2="477" y2="256" class="u-line" marker-end="url(#mk-fs10-1)"/>
        <line x1="667" y1="234" x2="667" y2="256" class="u-line" marker-end="url(#mk-fs10-1)"/>
        <rect x="15" y="260" width="165" height="58" rx="8" class="u-hl"/>
        <text x="97" y="282" class="u-title">Dashboard</text>
        <text x="97" y="302" class="u-lbl" text-anchor="middle">Promise.all → 3 service</text>
        <rect x="200" y="260" width="165" height="58" rx="8" class="u-hl"/>
        <text x="282" y="282" class="u-title">Produk</text>
        <text x="282" y="302" class="u-lbl" text-anchor="middle">product-service</text>
        <rect x="395" y="260" width="165" height="58" rx="8" class="u-hl"/>
        <text x="477" y="282" class="u-title">Pesanan</text>
        <text x="477" y="302" class="u-lbl" text-anchor="middle">order-service</text>
        <rect x="585" y="260" width="160" height="58" rx="8" class="u-hl"/>
        <text x="665" y="282" class="u-title">Notifikasi</text>
        <text x="665" y="302" class="u-lbl" text-anchor="middle">notification-service</text>
        <line x1="380" y1="318" x2="380" y2="341" class="u-line" marker-end="url(#mk-fs10-1)"/>
        <rect x="15" y="345" width="730" height="52" rx="8" class="u-hd"/>
        <text x="380" y="368" class="u-title">Lapisan API — api/client.js (axios, baseURL "/api")</text>
        <text x="380" y="387" class="u-lbl" text-anchor="middle">productApi · orderApi · notificationApi — tanpa URL absolut di dalam komponen</text>
        </svg></div><figcaption class="fig-cap"><b>Gambar 10.1</b> — Kerangka aplikasi frontend: dari pembungkus global ke empat halaman, semuanya melewati satu lapisan API</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Pembungkus Global: Lokali Dulu, Baru Rute</h3><p>Tiga pembungkus di <code>main.jsx</code> masing-masing punya tugas tunggal: <code>ConfigProvider</code> mengganti bahasa komponen Ant Design ke Indonesia (tanggal, "required", tombol), <code>AntApp</code> menyediakan konteks untuk pesan singkat (<code>message</code>), dan <code>BrowserRouter</code> mengaktifkan routing berbasis URL. Urutannya penting: konteks harus membungkus route agar semua turunannya mendapat layanan yang sama.</p>'
    },
    {
      type: 'example',
      title: 'main.jsx: bingkai sekali, dipakai selamanya',
      lang: 'jsx',
      output: false,
      code: `import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App as AntApp, ConfigProvider } from 'antd';
import idID from 'antd/locale/id_ID';
import App from './App.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider locale={idID}>
      <AntApp>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>
);`,
      explain: [
        '<code>React.StrictMode</code> mendeteksi praktik berbahaya saat pengembangan (efek samping yang tidak dibersihkan) — secara otomatis mengeksekusi efek dua kali di mode dev, sehingga pola cleanup yang benar dipaksa sejak awal.',
        'Ant Design v6 memisahkan <code>ConfigProvider</code> (konfigurasi global seperti locale) dari <code>AntApp</code> (konteks komponen); keduanya wajib ada agar <code>App.useApp()</code> dan terjemahan Indonesia berfungsi.',
        'Setiap halaman tidak perlu lagi menulis import router — cukup <code>&lt;Outlet/&gt;</code> di AppShell yang menggambar isi rute aktif.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Peta Rute dan Kerangka Layout</h3><p><code>App.jsx</code> mendeklarasikan seluruh rute dalam satu tempat. Semua halaman menjadi anak dari <code>AppShell</code> (route layout tanpa path), sehingga sidebar dan header tetap sama hanya isi yang berganti. Rute <code>*</code> menangkap URL yang tidak dikenal, dan rute indeks langsung mengarahkan pengunjung ke halaman Produk.</p>'
    },
    {
      type: 'example',
      title: 'App.jsx: seluruh rute dalam satu potongan',
      lang: 'jsx',
      output: false,
      code: `export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/products" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}`,
      explain: [
        'Route tanpa <code>path</code> di baris pertama adalah <b>route layout</b>: ia tidak menghasilkan URL sendiri, hanya membungkus anak-anaknya dengan AppShell.',
        '<code>Navigate replace</code> mengganti entri riwayat — pengunjung menekan "kembali" tidak akan kembali ke halaman kosong di root.',
        'Menambah halaman baru = menambah satu baris di sini + satu berkas di <code>pages/</code>. Tidak ada file konfigurasi lain yang disentuh.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Polanya: Satu Cetakan untuk Semua Halaman</h3><p>Setiap halaman di TokoKita memakai cetakan yang sama, dan pola ini berlaku di hampir semua aplikasi React yang berhadapan dengan API:</p><p><b>1. State</b> — daftar item, bendera <code>loading</code>, dan state UI (modal terbuka, form). <b>2. Fungsi muat</b> — satu fungsi async yang mengambil data dan SELALU menyelesaikan bendera loading di blok <code>finally</code>. <b>3. Efek samping</b> — <code>useEffect</code> memanggil fungsi muat saat halaman pertama kali muncul, dengan bendera <code>hidup</code> agar respons yang tiba setelah pengguna berpindah halaman tidak mengubah state yang sudah tidak berlaku. <b>4. Muat ulang setelah mutasi</b> — setiap simpan/hapus memanggil <code>muat()</code> kembali, bukan menyisipkan baris ke state secara manual.</p>'
    },
    {
      type: 'example',
      title: 'Halaman Produk: CRUD lengkap dalam satu file',
      lang: 'jsx',
      output: false,
      code: `export default function Products() {
  const { message } = App.useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cache, setCache] = useState('—');
  const [form] = Form.useForm();
  const [modal, setModal] = useState({ open: false, editing: null });

  async function muat() {
    try {
      setLoading(true);
      const { items: data, cache: status } = await productApi.listWithCache();
      setItems(data);
      setCache(status);          // header X-Cache: HIT / MISS dari Redis
    } catch (err) {
      message.error(pesanGalat(err, 'Gagal memuat produk'));
    } finally {
      setLoading(false);         // selalu dilepas, walau terjadi galat
    }
  }

  useEffect(() => {
    muat();
  }, []);

  async function simpan() {
    const values = await form.validateFields();   // lempar sendiri bila belum valid
    try {
      if (modal.editing) {
        await productApi.update(modal.editing.id, values);
        message.success(\`Produk "\${values.name}" diperbarui\`);
      } else {
        await productApi.create(values);
        message.success(\`Produk "\${values.name}" ditambahkan\`);
      }
      setModal({ open: false, editing: null });
      muat();                                     // sumber kebenaran = server
    } catch (err) {
      if (err.errorFields) return; // validasi form — biar Ant Design yang menandai
      message.error(pesanGalat(err, 'Gagal menyimpan produk'));
    }
  }`,
      explain: [
        '<code>finally</code> adalah jaring pengaman: tanpanya, satu kegagalan jaringan membuat tabel berputar selamanya karena <code>loading</code> tak pernah kembali false.',
        'Percabangan <code>err.errorFields</code> membedakan dua jenis galat dalam satu blok catch: galat validasi form (sudah ditandai Ant Design, cukup diam) versus galat server (layak ditampilkan sebagai pesan).',
        'Menampilkan <code>cache: HIT/MISS</code> dari header <code>X-Cache</code> adalah bukti visual Redis — optimasi yang biasanya tak terlihat kini jadi bagian dari antarmuka.',
        'Setelah simpan, halaman memanggil <code>muat()</code> — bukan menambahkan item ke state lokal. Server tetap menjadi sumber kebenaran, termasuk untuk ID dan waktu yang dibuatkannya.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Komponen Ant Design yang Dipakai</h3><p>Ant Design dipilih karena mencakup kebutuhan panel administrasi hampir seluruhnya: <code>Table</code> dengan pengurutan dan renderer kolom kustom, <code>Form</code> + <code>Modal</code> untuk form dialog, <code>Popconfirm</code> untuk konfirmasi hapus (lebih baik daripada <code>window.confirm</code> bawaan browser), <code>List</code> untuk daftar notifikasi, <code>Badge</code> untuk lonceng, serta <code>Statistic</code> + <code>Card</code> untuk dashboard. Pesan singkat dipanggil lewat <code>App.useApp()</code> — hook konteks, bukan API statis global — agar ikut tunduk pada konfigurasi locale.</p>'
    },
    {
      type: 'example',
      title: 'Tabel dengan kolom hasil render sendiri',
      lang: 'jsx',
      output: false,
      code: `const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency', currency: 'IDR', maximumFractionDigits: 0
});

const columns = [
  { title: 'ID', dataIndex: 'id', width: 70 },
  { title: 'Nama', dataIndex: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
  { title: 'Kategori', dataIndex: 'category', width: 130,
    render: (v) => <Tag color="blue">{v}</Tag> },
  { title: 'Harga', dataIndex: 'price', width: 150, align: 'right',
    render: (v) => rupiah.format(v), sorter: (a, b) => a.price - b.price },
  { title: 'Stok', dataIndex: 'stock', width: 90, align: 'right',
    render: (v) => (v > 10 ? v : <Tag color="red">{v}</Tag>) },
  {
    title: 'Aksi', width: 140,
    render: (_, row) => (
      <Space>
        <Button size="small" icon={<EditOutlined />} onClick={() => bukaUbah(row)} />
        <Popconfirm title={\`Hapus "\${row.name}"?\`} onConfirm={() => hapus(row)}>
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      </Space>
    )
  }
];`,
      explain: [
        '<code>render</code> mengubah nilai mentah menjadi tampilan (Tag berwarna, rupiah) tanpa mengubah data — data yang dikirim ke komponen tetap polos dan mudah diuji.',
        '<code>sorter</code> membuat pengurutan terjadi di klien; untuk tabel berjumlah puluhan ribu baris, pengurutan sebaiknya dioper ke server lewat query <code>ORDER BY</code>.',
        'Stok yang mengecil diberi label merah langsung di kolom — umpan balik visual tanpa perlu pengguna membuka detail produk.'
      ]
    },
    {
      type: 'example',
      title: 'Dashboard: menyatukan tiga service dalam satu layar',
      lang: 'jsx',
      output: false,
      code: `/* Dashboard membaca dari TIGA service sekaligus — menunjukkan bagaimana
   frontend menyatukan microservices yang masing-masing punya database sendiri. */
useEffect(() => {
  let hidup = true;
  (async () => {
    try {
      const [products, orders, notif] = await Promise.all([
        productApi.list(),
        orderApi.list(),
        notificationApi.list()
      ]);
      if (!hidup) return;
      setStats({
        products: products.length,
        orders: orders.length,
        revenue: orders.reduce((s, o) => s + o.total, 0),
        unread: notif.unread
      });
    } catch (err) {
      message.error(pesanGalat(err, 'Gagal memuat dashboard'));
    } finally {
      if (hidup) setLoading(false);
    }
  })();
  return () => { hidup = false; };
}, []);`,
      explain: [
        '<code>Promise.all</code> mengirim ketiga permintaan serentak — total waktu layar = permintaan TERLEMBAT, bukan jumlahnya. Tiga panggilan berurutan akan melipatgandakan waktu tunggu tanpa alasan.',
        'Bendera <code>hidup</code> dipasang kembali di sini: komponen dashboard gampang ditinggalkan (misal pengguna langsung ke menu lain), dan respons yang telat tidak boleh mengubah state halaman yang sudah diganti.',
        'Angka pendapatan dihitung dari daftar pesanan yang baru diterima — frontend boleh mengagregasi untuk tampilan, tetapi keputusan bisnis tetap dihitung di server.'
      ]
    },
    {
      type: 'tip',
      title: 'Satu Sumber Panggilan: folder api/',
      text: 'Seluruh panggilan HTTP dikumpulkan di tiga modul kecil (<code>productApi.js</code>, <code>orderApi.js</code>, <code>notificationApi.js</code>) di atas satu instance axios dengan <code>baseURL: "/api"</code>. Manfaatnya dua: komponen tidak pernah menyimpan URL yang bisa kedaluwarsa, dan mengganti cara rute (nginx produksi maupun proxy Vite saat pengembangan) tidak menyentuh satu pun komponen. Pesan galat pun disatukan lewat <code>pesanGalat()</code> karena backend selalu membalas <code>{ message: "..." }</code>.'
    },
    {
      type: 'warn',
      title: 'Jangan Menambal State Setelah Simpan',
      text: 'Setelah create/update/delete, halaman di TokoKita SELALU memanggil <code>muat()</code> untuk mengambil daftar baru dari server. Menyisipkan item hasil POST ke state lokal terlihat lebih cepat, tetapi membuka jarak antara yang dilihat pengguna dengan kenyataan database — terutama saat server mengisi kolom sendiri (ID, waktu) atau menolak sebagian data. Layar yang diambil ulang tidak pernah berbohong.'
    },
    {
      type: 'example',
      title: 'Menjalankan frontend dalam dua mode',
      lang: 'bash',
      output: false,
      code: `# Mode pengembangan — Vite + hot reload, proxy diatur di vite.config.js
cd examples/fullstack-microservice/frontend
npm install
npm run dev          # buka http://localhost:5173

# Mode produksi — hasil build disajikan nginx di dalam container
npm run build        # menghasilkan folder dist/
# (build image lewat compose dari folder induk: podman-compose up --build)

# Periksa hasil build
ls dist/             # index.html + aset-aset ter-hash`,
      explain: [
        'Saat pengembangan, perubahan kode terlihat dalam hitungan milidetik tanpa build ulang — Vite menyajikan modul ES langsung dari memori.',
        'Folder <code>dist/</code> hanya berisi file statis siap saji; di produksi tidak ada Node.js yang berjalan sama sekali, hanya nginx — attack surface lebih kecil.',
        '<code>npm install</code> mengunci versi dari <code>package-lock.json</code>; di image Docker perintah ini dijalankan terpisah sebelum menyalin kode agar lapisan cache modul tidak terbuang setiap kali kode berubah.'
      ]
    },
    {
      type: 'vocab',
      items: [
        ['SPA (Single Page Application)', 'Aplikasi yang menggambar seluruh halamannya di browser dari satu berkas HTML; navigasi diganti oleh router klien, bukan pemuatan halaman baru.'],
        ['Vite', 'Alat build & server pengembangan frontend berbasis ES modules — menyajikan modul langsung saat dev dan menghasilkan bundel optimal saat build.'],
        ['React Router', 'Paket routing klien: memetakan URL ke komponen tanpa memuat ulang halaman; di TokoKita memakai pola route layout + Outlet.'],
        ['Ant Design (antd)', 'Pustaka komponen UI berisi Table, Form, Modal, Badge, dll. dengan tema dan locale bawaan — mempercepat pembangunan panel administrasi.'],
        ['ConfigProvider', 'Komponen pembungkus Ant Design untuk konfigurasi global; dipakai di TokoKita untuk mengganti locale ke id_ID (bahasa Indonesia).'],
        ['App.useApp()', 'Hook konteks Ant Design untuk pesan (message) dan notifikasi — cara resmi agar pesan tunduk pada konfigurasi global.'],
        ['Fan-in dengan Promise.all', 'Menggabungkan beberapa sumber data paralel menjadi satu state; waktu tunggu = permintaan paling lambat, bukan jumlahnya.'],
        ['Popconfirm', 'Dialog konfirmasi kecil yang menempel pada tombol — pola konfirmasi aksi destruktif (hapus) yang umum di UI admin.'],
        ['Intl.NumberFormat', 'API bawaan JavaScript untuk format lokal — dipakai menampilkan rupiah (id-ID) tanpa pustaka tambahan.'],
        ['Bendera hidup (is-alive)', 'Penanda boolean di dalam closure efek samping yang mencegah pembaruan state setelah komponen bongkar — standar pembersihan efek async.']
      ]
    }
  ],
  recap: [
    'Aplikasi berlapis: main.jsx (bingkai global) → App.jsx (rute) → AppShell (layout) → empat halaman di pages/, dengan lapisan api/ terpisah.',
    'Setiap halaman memakai cetakan sama: state + muat() dengan finally + useEffect berbendera hidup + muat-ulang setelah mutasi.',
    'Seluruh panggilan HTTP lewat satu axios baseURL "/api" — komponen tidak pernah menyimpan URL service.',
    'Ant Design menyediakan Table, Form, Modal, Popconfirm, Badge, List; pesan lewat App.useApp() dan locale Indonesia lewat ConfigProvider.',
    'Dashboard membuktikan tiga service menyatu dalam satu layar dengan Promise.all; angka lonceng datang dari header X-Unread-Count.'
  ]
});
