import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function onFinish(values) {
    try {
      setError(null);
      setLoading(true);
      await register({ name: values.name, username: values.username, password: values.password });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Pendaftaran gagal — pastikan backend berjalan');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="center-page">
      <Card className="auth-card" title="Buat Akun Baru">
        {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Nama Lengkap"
            name="name"
            rules={[{ required: true, message: 'Nama wajib diisi' }]}
          >
            <Input placeholder="Budi Santoso" />
          </Form.Item>
          <Form.Item
            label="Username"
            name="username"
            rules={[
              { required: true, message: 'Username wajib diisi' },
              { min: 3, message: 'Minimal 3 karakter' }
            ]}
          >
            <Input placeholder="budi" autoComplete="username" />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            dependencies={['konfirmasi']}
            rules={[
              { required: true, message: 'Password wajib diisi' },
              { min: 6, message: 'Minimal 6 karakter' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('konfirmasi') === value) return Promise.resolve();
                  return Promise.reject(new Error('Konfirmasi password tidak sama'));
                }
              })
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            label="Konfirmasi Password"
            name="konfirmasi"
            dependencies={['password']}
            rules={[{ required: true, message: 'Ulangi password' }]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Daftar
          </Button>
        </Form>
        <Typography.Paragraph style={{ marginTop: 16, marginBottom: 0, textAlign: 'center' }}>
          Sudah punya akun? <Link to="/login">Masuk</Link>
        </Typography.Paragraph>
      </Card>
    </div>
  );
}
