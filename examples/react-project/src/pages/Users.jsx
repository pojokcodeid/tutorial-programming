import { useEffect, useState } from 'react';
import { App, Button, Popconfirm, Table, Tag } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import PageHeader from '../components/PageHeader.jsx';
import * as userApi from '../api/userApi.js';
import { useAuth } from '../auth/AuthContext.jsx';

/* Halaman admin: daftar user + hapus user.
   Jika dicoba sebagai user biasa, backend membalas 403 dan
   interceptor akan meneruskannya sebagai pesan error. */
export default function Users() {
  const { message } = App.useApp();
  const { user: saya } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let aktif = true;
    userApi
      .list()
      .then((data) => aktif && setUsers(data))
      .catch((err) => aktif && message.error(err.response?.data?.message || 'Gagal memuat user'))
      .finally(() => aktif && setLoading(false));
    return () => { aktif = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function hapus(u) {
    try {
      await userApi.remove(u.id);
      message.success(`User "${u.name}" dihapus`);
      setUsers((lama) =>lama.filter((x) => x.id !== u.id));
    } catch (err) {
      message.error(err.response?.data?.message || 'Gagal menghapus user');
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: 'Nama', dataIndex: 'name' },
    { title: 'Username', dataIndex: 'username' },
    {
      title: 'Peran',
      dataIndex: 'role',
      render: (role) => <Tag color={role === 'admin' ? 'gold' : 'blue'}>{role}</Tag>
    },
    {
      title: 'Aksi',
      key: 'aksi',
      render: (_, u) => (
        <Popconfirm title={`Hapus user ${u.username}?`} onConfirm={() => hapus(u)}>
          <Button size="small" danger icon={<DeleteOutlined />} disabled={u.id === saya.id}>
            Hapus
          </Button>
        </Popconfirm>
      )
    }
  ];

  return (
    <>
      <PageHeader title="Manajemen User" subtitle="Halaman khusus admin (RoleGate)" />
      <Table rowKey="id" loading={loading} columns={columns} dataSource={users} />
    </>
  );
}
