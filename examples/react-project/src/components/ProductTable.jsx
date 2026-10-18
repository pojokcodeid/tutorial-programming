import { Button, Popconfirm, Space, Table, Tag } from 'antd';
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
}
