import { Layout, Menu, Button, Space, Tag, Dropdown } from 'antd';
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
}
