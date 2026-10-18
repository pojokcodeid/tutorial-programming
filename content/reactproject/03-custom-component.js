/* ============================================================
   Pelajaran Contoh Project React JS — Bab 3: Custom Component dengan Ant Design
   ============================================================ */
'use strict';

window.REACTPROJECT_LESSONS = window.REACTPROJECT_LESSONS || [];

window.REACTPROJECT_LESSONS.push({
  id: 'rp-custom-component',
  title: 'Custom Component dengan Ant Design',
  chapter: 'Komponen & Navigasi',
  duration: '15 menit',
  intro: [
    'Ant Design sudah menyediakan komponen jadi — Card, Table, Form, Tag, Button — sehingga kamu tidak perlu menggambar UI dari nol. Tapi pengalaman aplikasi yang rapi tidak lahir dari komponen mentah: judul halaman yang konsisten di semua layar, kartu statistik yang seragam, dan tabel dengan aturan tombol yang benar tetap harus <b>dibungkus lagi</b> menjadi komponen milik aplikasimu sendiri.',
    'Bungkusan itulah yang disebut <b>custom component</b>: komponen buatan sendiri yang menggabungkan komponen antd + props + sedikit logika, lalu dipakai ulang lintas halaman. Di pelajaran ini kamu menyusun empat komponen kustom dari proyek Dashboard Toko — <code>PageHeader</code>, <code>StatCard</code>, <code>ProductTable</code>, dan <code>AppShell</code> — dari yang paling sederhana sampai yang membaca konteks login.'
  ],
  objectives: [
    'Memahami kapan sebuah potongan UI layak dijadikan komponen kustom',
    'Membuat komponen presentasional murni yang menerima data lewat props',
    'Membungkus komponen Ant Design (Table) menjadi komponen milik aplikasi',
    'Menerapkan aturan tampilan berbasis data, misalnya menonaktifkan tombol yang tidak boleh dipakai',
    'Menyusun layout aplikasi dari beberapa komponen kustom',
    'Membedakan komponen presentasional dan container'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Apa itu custom component?</h3><p><b>Custom component</b> adalah komponen React buatan sendiri yang membungkus markup dan komponen Ant Design menjadi satu unit bernama. Kalau Ant Design menyediakan "bata" (Card, Table, Button), komponen kustom adalah "batako"-nya: bentuk yang lebih besar, siap dipasang, dan sesuai standar aplikasimu.</p><p>Secara garis besar komponen kustom terbagi dua. <b>Komponen presentasional</b> hanya menampilkan data dari props — tanpa ambil data, tanpa efek samping (contoh: PageHeader, StatCard). <b>Komponen container</b> mengurus data: mengambil dari API, membaca context/state, lalu menyerahkan hasilnya ke komponen tampilan (contoh: AppShell membaca useAuth, ProductTable menerima products dari halaman). Keduanya dipakai dengan prinsip yang sama: <b>sekali menulis, dipakai banyak halaman</b> — perubahan tampilan cukup dilakukan di satu berkas, bukan disalin ke sepuluh halaman.</p>'
    },
    {
      type: 'example',
      title: 'PageHeader.jsx — judul halaman yang konsisten',
      lang: 'jsx',
      output: false,
      code: `import { Space, Typography } from 'antd';

/* Judul halaman yang konsisten di semua halaman */
export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {title}
        </Typography.Title>
        {subtitle && <Typography.Text type="secondary">{subtitle}</Typography.Text>}
      </div>
      <Space wrap>{actions}</Space>
    </div>
  );
}`,
      explain: [
        'Komponen ini <b>presentasional murni</b>: tidak ada state, tidak ada panggilan API — semua isi datang dari tiga props: <code>title</code>, <code>subtitle</code>, dan <code>actions</code>.',
        'Props <code>actions</code> menerima berkas JSX berisi tombol dari halaman pemakai, lalu dirender di dalam <code>Space</code> Ant Design yang otomatis memberi jarak antar tombol.',
        'Pola <code>subtitle &amp;&amp; ...</code> membuat subtitle menjadi opsional: teks kedua hanya dirender bila diisi halaman pemakai.',
        'Hasilnya, halaman cukup menulis <code>&lt;PageHeader title="Produk" subtitle="CRUD data produk" actions={...tombol...} /&gt;</code> — gaya judul berubah cukup dari satu berkas ini.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Kartu statistik yang seragam</h3><p>Dashboard menampilkan empat angka ringkasan: total produk, total stok, jumlah kategori, dan nilai persediaan. Tanpa komponen kustom, kamu akan menyalin markup <code>Card</code> + <code>Statistic</code> empat kali dan mengganti angkanya satu per satu. Dengan <code>StatCard</code>, cukup mengganti data — markup dan gaya tetap sama sekali.</p>'
    },
    {
      type: 'example',
      title: 'StatCard.jsx — satu komponen untuk semua angka dashboard',
      lang: 'jsx',
      output: false,
      code: `import { Card, Statistic, Typography } from 'antd';

/* Kartu statistik — satu komponen dipakai ulang untuk semua angka di dashboard */
export default function StatCard({ title, value, hint, color = '#1677ff' }) {
  return (
    <Card variant="outlined" className="stat-card">
      <Statistic title={title} value={value} styles={{ content: { color } }} />
      {hint && <Typography.Text type="secondary">{hint}</Typography.Text>}
    </Card>
  );
}`,
      explain: [
        'Prop <code>color</code> memakai nilai bawaan <code>#1677ff</code> (biru Ant Design) lewat default parameter JS biasa — memanggil StatCard tanpa color tetap aman.',
        'Di Ant Design v6 prop <code>valueStyle</code> sudah deprecated; penggantinya adalah prop <code>styles</code> berisi objek per bagian komponen — di sini <code>styles.content</code> memberi warna pada area angka.',
        'Dashboard memanggil StatCard empat kali dengan data berbeda (judul, nilai, hint, warna) — markup kartu tetap satu definisi.',
        'Props dibungkus JSX: <code>value</code> boleh berupa angka maupun string, sehingga angka yang belum dimuat bisa ditampilkan sebagai <code>&#123;&apos;…&apos;&#125;</code> sementara.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Membungkus Table menjadi komponen aplikasi</h3><p><code>Table</code> Ant Design sangat powerful, tapi konfigurasinya lebar: definisi kolom, render kustom per sel, pagination, sampai aturan tombol aksi. Semua itu adalah <b>pengetahuan domain aplikasi</b> — seharusnya tidak tercecer di setiap halaman. <code>ProductTable</code> menerima <code>products</code> dan <code>loading</code> sebagai props, lalu menyusun kolom dan aturan tombol sekali di sini; halaman cukup menulis <code>&lt;ProductTable ... /&gt;</code>.</p>'
    },
    {
      type: 'example',
      title: 'ProductTable.jsx — Table + kolom kustom + aturan tombol',
      lang: 'jsx',
      output: false,
      code: `import { Button, Popconfirm, Space, Table, Tag } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useAuth } from '../auth/AuthContext.jsx';

export const formatRupiah = (nilai) => 'Rp' + Number(nilai).toLocaleString('id-ID');

/* Tabel produk: komponen kustom yang membungkus <Table/> Ant Design.
   Kolom, tombol aksi, dan aturan "boleh ubah/hapus" dideklarasikan sekali
   di sini agar halaman cukup memakai <ProductTable ... /> */
export default function ProductTable({ products, loading, onEdit, onDelete }) {
  const { user, isAdmin } = useAuth();

  const columns = [
    { title: 'Produk', dataIndex: 'name', key: 'name' },
    {
      title: 'Kategori',
      dataIndex: 'category',
      key: 'category',
      render: (kategori) => <Tag>{kategori}</Tag>
    },
    {
      title: 'Harga',
      dataIndex: 'price',
      key: 'price',
      align: 'right',
      render: formatRupiah
    },
    {
      title: 'Stok',
      dataIndex: 'stock',
      key: 'stock',
      align: 'right',
      render: (stok) => <Tag color={stok <= 5 ? 'red' : 'green'}>{stok}</Tag>
    },
    {
      title: 'Aksi',
      key: 'aksi',
      render: (_, produk) => {
        /* otorisasi di sisi tampilan: hanya admin atau pemilik produk */
        const bolehUbah = isAdmin || produk.createdBy === user.id;
        return (
          <Space>
            <Button
              size="small"
              icon={<EditOutlined />}
              disabled={!bolehUbah}
              onClick={() => onEdit(produk)}
            >
              Ubah
            </Button>
            <Popconfirm
              title="Hapus produk ini?"
              description={produk.name}
              onConfirm={() => onDelete(produk)}
            >
              <Button size="small" danger icon={<DeleteOutlined />} disabled={!bolehUbah}>
                Hapus
              </Button>
            </Popconfirm>
          </Space>
        );
      }
    }
  ];

  return (
    <Table
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={products}
      pagination={{ pageSize: 5, showSizeChanger: false }}
    />
  );
}`,
      explain: [
        'Setiap objek kolom punya <code>title</code> (judul), <code>dataIndex</code> (nama field data), dan <code>key</code> (kunci unik). Tanpa <code>dataIndex</code>, kolom tidak tahu field mana yang ditampilkan.',
        'Prop <code>render</code> adalah render callback: fungsi yang mengubah nilai mentah menjadi JSX. Kolom Kategori membungkus nilai dengan <code>Tag</code>, kolom Harga memakai <code>formatRupiah</code>, dan kolom Stok memberi Tag merah bila stok &le; 5, hijau kalau tidak.',
        'Callback <code>render</code> kolom Aksi menerima dua argumen: <code>(nilaiSel, produk)</code> — karena tombol butuh objek produk utuh, argumen pertama dilewati dengan <code>_</code>.',
        'Aturan tampilan berbasis data: <code>bolehUbah = isAdmin || produk.createdBy === user.id</code> lalu <code>disabled={!bolehUbah}</code> — tombol Ubah/Hapus otomatis mati untuk produk milik orang lain.',
        'Table juga menerima <code>rowKey</code>, <code>loading</code>, dan <code>pagination</code> dari props — halaman cukup meneruskan data produk dan status memuat.',
        '<code>formatRupiah</code> diekspor dengan <code>export const</code> sehingga Dashboard bisa memakai fungsi format yang sama tanpa menduplikasi.'
      ]
    },
    {
      type: 'text',
      html: '<h3>AppShell: komponen sekaligus layout</h3><p>Komponen kustom tidak selalu tampilan kecil. <code>AppShell</code> adalah kerangka halaman: sidebar menu, header berisi judul + akun, dan area konten yang diisi React Router lewat <code>&lt;Outlet/&gt;</code>. Ia juga contoh <b>container</b>: membaca <code>useAuth()</code> untuk menentukan menu mana yang boleh tampil dan siapa nama user di pojok kanan atas.</p>'
    },
    {
      type: 'example',
      title: 'AppShell.jsx — layout + menu dinamis + akun',
      lang: 'jsx',
      output: false,
      code: `import { Layout, Menu, Button, Space, Tag, Dropdown } from 'antd';
import {
  DashboardOutlined,
  LogoutOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

const { Sider, Header, Content } = Layout;

/* Layout aplikasi: menu di kiri, judul + akun di kanan atas,
   dan isi halaman dirender oleh <Outlet/> dari React Router. */
export default function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();

  /* halaman aktif dihitung dari segmen pertama URL, mis. /products/3/edit → /products */
  const halamanAktif = '/' + (location.pathname.split('/')[1] || '');

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/products', icon: <ShoppingCartOutlined />, label: 'Produk' },
    /* otorisasi di sisi tampilan: menu user hanya untuk admin */
    ...(isAdmin ? [{ key: '/users', icon: <TeamOutlined />, label: 'User' }] : [])
  ];

  const akunItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Keluar',
      onClick: () => logout().then(() => navigate('/login', { replace: true }))
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0">
        <div className="brand">🛒 Toko Dashboard</div>
        <Menu
          theme="dark"
          mode="inline"
          items={menuItems}
          selectedKeys={[halamanAktif]}
          onClick={(e) => navigate(e.key)}
        />
      </Sider>

      <Layout>
        <Header className="app-header">
          <span className="header-title">Contoh Project React — Ant Design + Axios + JWT</span>
          <Dropdown menu={{ items: akunItems }}>
            <Button type="text">
              <Space>
                <UserOutlined />
                {user.name}
                <Tag color={isAdmin ? 'gold' : 'blue'}>{user.role}</Tag>
              </Space>
            </Button>
          </Dropdown>
        </Header>

        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}`,
      explain: [
        '<code>Layout</code>, <code>Sider</code>, <code>Header</code>, dan <code>Content</code> adalah komponen antd untuk kerangka halaman — kamu tidak menulis CSS grid/flex untuk sidebar dari nol.',
        'Array <code>menuItems</code> dibangun secara dinamis dengan pola spread <code>...(isAdmin ? [{...}] : [])</code>: bila isAdmin false, spread menyebarkan nol elemen sehingga menu User tidak pernah muncul.',
        'Menu antd dipakai dalam mode "kendali penuh": <code>selectedKeys</code> menentukan item tersorot dan <code>onClick</code> memanggil <code>navigate(e.key)</code> — keduanya memakai key yang sama.',
        '<code>Dropdown</code> membungkus tombol akun; isinya berupa objek menu dengan <code>onClick</code> yang menjalankan logout lalu pindah ke /login dengan <code>replace</code>.',
        '<code>&lt;Outlet/&gt;</code> adalah titik kosong tempat React Router merender halaman yang cocok dengan URL — AppShell adalah layout, bukan halaman.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Prinsip menyusun komponen kustom</h3><p>Dari empat komponen di atas terlihat pola yang sama. <b>Taruh data di atas, keputusan di bawah</b>: komponen menerima data lewat props dan meneruskan kejadian lewat callback (<code>onEdit</code>, <code>onDelete</code>) — ia tidak tahu data itu dari API atau state. <b>Gunakan komposisi</b> daripada prop yang membludak: PageHeader menerima JSX lewat <code>actions</code>, AppShell menerima seluruh halaman lewat <code>&lt;Outlet/&gt;</code>. Dan <b>jangan menyalin-tempel markup</b> — kalau potongan yang sama muncul di dua halaman, saatnya diangkat menjadi komponen.</p>'
    },
    {
      type: 'tip',
      title: 'Komponen kustom = kontrak props yang jelas',
      text: 'Tulis nama props secara konsisten dan beri default bila memungkinkan (<code>color = &apos;#1677ff&apos;</code>). Saat props sebuah komponen mulai banyak dan saling berkaitan, pertimbangkan untuk menerimanya sebagai objek atau memecah komponennya — jangan menumpuk 10 parameter posisional yang tidak jelas fungsinya.'
    },
    {
      type: 'warn',
      title: 'Menyembunyikan tombol bukan keamanan',
      text: 'Menu admin yang disembunyikan dan tombol <code>disabled</code> hanya kenyamanan tampilan. Semua kode di folder <code>src/</code> bisa dibaca siapa pun lewat DevTools, jadi server tetap wajib memverifikasi peran dan kepemilikan (di proyek ini <code>server.js</code> memeriksa token dan peran untuk setiap request tulis). Anggap <code>bolehUbah</code> sebagai UX, bukan pagar.'
    },
    {
      type: 'live',
      title: 'Latihan: satu komponen, banyak data',
      lang: 'html',
      hint: 'Fungsi renderKartu() adalah "komponennya" — klik Tambah Data untuk melihat kartu baru terbentuk dari fungsi yang sama, lalu Hapus Terakhir untuk mengembalikannya. Perhatikan bahwa markup kartu hanya ditulis sekali.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Satu Komponen, Banyak Data</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; background: #f5f7fa; }
    h2 { margin: 0 0 4px; font-size: 18px; }
    p.ket { color: #666; margin: 0 0 16px; font-size: 13px; }
    .toolbar { display: flex; gap: 8px; margin-bottom: 16px; }
    button { border: 0; border-radius: 6px; padding: 8px 14px; background: #1677ff; color: #fff; cursor: pointer; font-size: 13px; }
    button.abu { background: #8c8c8c; }
    #kartu { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
    .stat { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; }
    .stat .judul { font-size: 12px; color: #888; }
    .stat .angka { font-size: 26px; font-weight: 700; margin-top: 4px; }
    .stat .petunjuk { font-size: 11px; color: #aaa; margin-top: 6px; }
    .kosong { color: #999; font-style: italic; }
  </style>
</head>
<body>
  <h2>Ringkasan Toko (simulasi StatCard)</h2>
  <p class="ket">Satu fungsi renderKartu() dipakai untuk SEMUA data — tambah/hapus data, kartunya ikut berubah sendiri.</p>
  <div class="toolbar">
    <button id="tambah">+ Tambah Data</button>
    <button id="hapus" class="abu">&minus; Hapus Terakhir</button>
  </div>
  <div id="kartu"></div>
  <script>
    // Sama seperti props di React: tiap item membawa "properti" judul, nilai, petunjuk, warna
    const data = [
      { judul: 'Total Produk', nilai: 12, petunjuk: 'baris pada /products', warna: '#1677ff' },
      { judul: 'Total Stok', nilai: 240, petunjuk: 'semua unit', warna: '#389e0d' }
    ];
    const palet = ['#1677ff', '#389e0d', '#722ed1', '#d46b08', '#cf1322'];

    // "Komponen kustom" — satu fungsi, menerima satu objek data (analog props)
    function renderKartu(item) {
      return \`<div class="stat">
        <div class="judul">\${item.judul}</div>
        <div class="angka" style="color:\${item.warna}">\${item.nilai}</div>
        <div class="petunjuk">\${item.petunjuk}</div>
      </div>\`;
    }

    // "Render list" — memetakan array menjadi gabungan markup, lalu satu kali innerHTML
    function render() {
      const wadah = document.getElementById('kartu');
      wadah.innerHTML = data.length
        ? data.map(renderKartu).join('')
        : '<p class="kosong">Belum ada data — klik Tambah Data.</p>';
    }

    document.getElementById('tambah').onclick = () => {
      const i = data.length;
      data.push({
        judul: 'Statistik #' + (i + 1),
        nilai: Math.floor(Math.random() * 500),
        petunjuk: 'angka acak',
        warna: palet[i % palet.length]
      });
      render();
    };

    document.getElementById('hapus').onclick = () => {
      data.pop();
      render();
    };

    render();
  </script>
</body>
</html>`
    },
    {
      type: 'vocab',
      items: [
        ['Custom component', 'Komponen React buatan sendiri yang membungkus markup dan/atau komponen lain menjadi satu unit pakai.'],
        ['Props', 'Data satu arah yang dikirim komponen induk ke anak — satu-satunya cara komponen menerima informasi dari luar.'],
        ['Composition', 'Menyusun UI dari komponen-komponen kecil, sering lewat children atau props berisi JSX (mis. actions di PageHeader).'],
        ['Presentasional component', 'Komponen yang hanya menampilkan data dari props — tanpa mengambil data, tanpa efek samping.'],
        ['Container component', 'Komponen yang mengurus data (API, state, context) lalu menyerahkannya ke komponen presentasional.'],
        ['Render callback', 'Props berupa fungsi yang menghasilkan JSX, dipakai saat isi bagian tertentu ditentukan pemakai (mis. kolom Table).'],
        ['Ant Design (antd)', 'Library komponen UI untuk React: Card, Table, Form, Tag, Button, Layout, dan lainnya.'],
        ['Declarative UI', 'Gaya mendeskripsikan tampilan yang seharusnya muncul sesuai data, bukan memberi perintah manipulasi DOM satu per satu.']
      ]
    }
  ],
  recap: [
    'Custom component membungkus komponen antd + markup + logika menjadi unit bernama: sekali menulis, dipakai banyak halaman.',
    'Komponen presentasional hanya menampilkan data dari props (PageHeader, StatCard); container mengurus data (AppShell, ProductTable).',
    'Objek kolom Table Ant Design: title (judul), dataIndex (field), key (kunci), align (perataan), render (render callback untuk sel kustom).',
    'Aturan tampilan berbasis data: bolehUbah = isAdmin || pemilik produk → tombol Ubah/Hapus di-disable untuk yang tidak berhak.',
    'Menu dinamis dibangun dengan spread ...(isAdmin ? [{...}] : []) sehingga item tertentu hanya muncul untuk peran tertentu.',
    'Menyembunyikan menu atau menonaktifkan tombol adalah UX semata — server tetap wajib memverifikasi hak akses.'
  ]
});
