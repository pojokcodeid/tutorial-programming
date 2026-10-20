import { useEffect, useState } from 'react';
import { Layout, Menu, Badge, Button, Space } from 'antd';
import {
  AppstoreOutlined,
  ShoppingCartOutlined,
  BellOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import * as notificationApi from '../api/notificationApi.js';

const { Sider, Header, Content } = Layout;

/* Layout aplikasi: menu di kiri, judul + lonceng notifikasi di kanan atas,
   dan isi halaman dirender oleh <Outlet/> dari React Router.

   Jumlah notifikasi belum dibaca diambil dari notification-service —
   header ini membuktikan tiga service bisa menyatu dalam satu tampilan. */
export default function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  /* Polling ringan: cek lonceng tiap 5 detik. Untuk skala besar,
     lebih hemat memakai SSE/WebSocket — lihat materi RabbitMQ bab SSE. */
  useEffect(() => {
    let hidup = true;
    async function cek() {
      try {
        const { unread: n } = await notificationApi.list();
        if (hidup) setUnread(n);
      } catch {
        /* service notifikasi mungkin sedang restart — abaikan */
      }
    }
    cek();
    const t = setInterval(cek, 5000);
    return () => {
      hidup = false;
      clearInterval(t);
    };
  }, []);

  const halamanAktif = '/' + (location.pathname.split('/')[1] || '');

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/products', icon: <AppstoreOutlined />, label: 'Produk' },
    { key: '/orders', icon: <ShoppingCartOutlined />, label: 'Pesanan' },
    {
      key: '/notifications',
      icon: (
        <Badge count={unread} size="small">
          <BellOutlined />
        </Badge>
      ),
      label: 'Notifikasi'
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0">
        <div className="brand">🛍️ TokoKita</div>
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
          <span className="header-title">Contoh Fullstack Microservices — Go · MariaDB · Redis · RabbitMQ · React</span>
          <Space>
            <Button type="text" onClick={() => navigate('/notifications')}>
              <Badge count={unread} size="small">
                <BellOutlined style={{ fontSize: 18 }} />
              </Badge>
            </Button>
          </Space>
        </Header>

        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
