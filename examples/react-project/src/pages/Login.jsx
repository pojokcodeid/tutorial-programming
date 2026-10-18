import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  /* tujuan awal sebelum dipaksa ke /login (bisa juga beranda) */
  const tujuan = location.state?.from?.pathname || '/';

  if (user) return <Navigate to="/" replace />;   // sudah login? tidak perlu lihat form

  async function onFinish(values) {
    try {
      setError(null);
      setLoading(true);
      await login(values.username, values.password);
      navigate(tujuan, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal — pastikan backend berjalan (npm run server)');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="center-page">
      <Card className="auth-card" title="Masuk ke Dashboard">
        {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: 'Username wajib diisi' }]}
          >
            <Input placeholder="admin" autoComplete="username" />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Password wajib diisi' }]}
          >
            <Input.Password placeholder="admin123" autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Masuk
          </Button>
        </Form>
        <Typography.Paragraph style={{ marginTop: 16, marginBottom: 0, textAlign: 'center' }}>
          Belum punya akun? <Link to="/register">Daftar</Link>
        </Typography.Paragraph>
      </Card>
    </div>
  );
}
