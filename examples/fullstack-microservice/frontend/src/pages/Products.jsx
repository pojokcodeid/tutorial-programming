import { useEffect, useState } from 'react';
import { App, Button, Table, Tag, Space, Popconfirm, Modal, Form, Input, InputNumber, Select } from 'antd';
import { PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import PageHeader from '../components/PageHeader.jsx';
import * as productApi from '../api/productApi.js';
import { pesanGalat } from '../api/client.js';

const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

/* Halaman CRUD produk — menghubungi product-service.
   Perhatikan kolom "Cache": nilai HIT/MISS diambil dari header X-Cache
   yang disetel Go, bukti nyata Redis bekerja di belakang layar. */
export default function Products() {
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
      setCache(status);
    } catch (err) {
      message.error(pesanGalat(err, 'Gagal memuat produk'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    muat();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function bukaBaru() {
    setModal({ open: true, editing: null });
    form.resetFields();
  }

  function bukaUbah(produk) {
    setModal({ open: true, editing: produk });
    form.setFieldsValue(produk);
  }

  async function simpan() {
    const values = await form.validateFields();
    try {
      if (modal.editing) {
        await productApi.update(modal.editing.id, values);
        message.success(`Produk "${values.name}" diperbarui`);
      } else {
        await productApi.create(values);
        message.success(`Produk "${values.name}" ditambahkan`);
      }
      setModal({ open: false, editing: null });
      muat();
    } catch (err) {
      if (err.errorFields) return; // galat validasi form, biar Ant Design yang menampilkan
      message.error(pesanGalat(err, 'Gagal menyimpan produk'));
    }
  }

  async function hapus(produk) {
    try {
      await productApi.remove(produk.id);
      message.success(`Produk "${produk.name}" dihapus`);
      muat();
    } catch (err) {
      message.error(pesanGalat(err, 'Gagal menghapus produk'));
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: 'Nama', dataIndex: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
    {
      title: 'Kategori',
      dataIndex: 'category',
      width: 130,
      render: (v) => <Tag color="blue">{v}</Tag>
    },
    {
      title: 'Harga',
      dataIndex: 'price',
      width: 150,
      align: 'right',
      render: (v) => rupiah.format(v),
      sorter: (a, b) => a.price - b.price
    },
    {
      title: 'Stok',
      dataIndex: 'stock',
      width: 90,
      align: 'right',
      render: (v) => (v > 10 ? v : <Tag color="red">{v}</Tag>)
    },
    {
      title: 'Aksi',
      width: 140,
      render: (_, row) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => bukaUbah(row)} />
          <Popconfirm title={`Hapus "${row.name}"?`} onConfirm={() => hapus(row)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <>
      <PageHeader
        title="Produk"
        subtitle={`Dari product-service — ${items.length} produk (cache: ${cache})`}
        actions={
          <>
            <Button icon={<ReloadOutlined />} onClick={muat}>
              Muat Ulang
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={bukaBaru}>
              Produk Baru
            </Button>
          </>
        }
      />

      <Table
        rowKey="id"
        columns={columns}
        dataSource={items}
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={modal.editing ? 'Ubah Produk' : 'Produk Baru'}
        open={modal.open}
        onOk={simpan}
        onCancel={() => setModal({ open: false, editing: null })}
        okText="Simpan"
        cancelText="Batal"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Nama"
            rules={[{ required: true, message: 'Nama produk wajib diisi' }]}
          >
            <Input placeholder="mis. Kopi Arabika Gayo" />
          </Form.Item>
          <Form.Item name="category" label="Kategori" initialValue="umum">
            <Select
              options={[
                { value: 'minuman', label: 'Minuman' },
                { value: 'makanan', label: 'Makanan' },
                { value: 'umum', label: 'Umum' }
              ]}
            />
          </Form.Item>
          <Form.Item
            name="price"
            label="Harga"
            rules={[{ required: true, message: 'Harga wajib diisi' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} addonAfter="Rp" />
          </Form.Item>
          <Form.Item name="stock" label="Stok" initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
