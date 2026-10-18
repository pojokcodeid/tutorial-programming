import { useEffect, useState } from 'react';
import { App, Button, Card, Form, Input, InputNumber } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import * as productApi from '../api/productApi.js';

const KOSONG = { name: '', category: '', price: 0, stock: 0 };

/* Satu komponen untuk dua pekerjaan: menambah (/products/new)
   dan mengubah (/products/:id/edit) — dipisah oleh keberadaan :id */
export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [memuat, setMemuat] = useState(Boolean(id));

  useEffect(() => {
    if (!id) return;
    productApi
      .get(id)
      .then((p) => form.setFieldsValue(p))
      .catch(() => message.error('Produk tidak ditemukan'))
      .finally(() => setMemuat(false));
  }, [id, form, message]);

  async function onFinish(values) {
    try {
      setLoading(true);
      if (id) {
        await productApi.update(id, values);
        message.success('Produk diperbarui');
      } else {
        await productApi.create(values);
        message.success('Produk ditambahkan');
      }
      navigate('/products');
    } catch (err) {
      message.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title={id ? 'Ubah Produk' : 'Produk Baru'}
        subtitle={id ? `ID #${id}` : 'Isi data lalu klik Simpan'}
        actions={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/products')}>
            Kembali
          </Button>
        }
      />
      <Card style={{ maxWidth: 560 }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={KOSONG}
          onFinish={onFinish}
          disabled={memuat}
        >
          <Form.Item
            label="Nama Produk"
            name="name"
            rules={[{ required: true, message: 'Nama produk wajib diisi' }]}
          >
            <Input placeholder="Kopi Arabika 250g" />
          </Form.Item>
          <Form.Item
            label="Kategori"
            name="category"
            rules={[{ required: true, message: 'Kategori wajib diisi' }]}
          >
            <Input placeholder="Minuman / Makanan / Kesehatan / Rumah" />
          </Form.Item>
          <Form.Item
            label="Harga (Rp)"
            name="price"
            rules={[{ required: true, message: 'Harga wajib diisi' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Stok" name="stock">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
            Simpan
          </Button>
        </Form>
      </Card>
    </>
  );
}
