import { useEffect, useState } from 'react';
import { App, Button, Table, Tag, Space, Form, Input, InputNumber, Select, Card } from 'antd';
import { ReloadOutlined, PlusOutlined } from '@ant-design/icons';
import PageHeader from '../components/PageHeader.jsx';
import * as orderApi from '../api/orderApi.js';
import * as productApi from '../api/productApi.js';
import { pesanGalat } from '../api/client.js';

const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

/* Halaman pesanan — menghubungi order-service.

   Saat tombol "Buat Pesanan" ditekan, terjadi rantai nyata:
   order-service memvalidasi produk ke product-service (HTTP),
   lalu menerbitkan event ke RabbitMQ yang dikonsumsi notification-service. */
export default function Orders() {
  const { message } = App.useApp();
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form] = Form.useForm();

  async function muat() {
    try {
      setLoading(true);
      const [orders, prods] = await Promise.all([orderApi.list(), productApi.list()]);
      setItems(orders);
      setProducts(prods);
    } catch (err) {
      message.error(pesanGalat(err, 'Gagal memuat pesanan'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    muat();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function buat(values) {
    try {
      setSending(true);
      const order = await orderApi.create({
        productId: values.product_id,
        qty: values.qty,
        customer: values.customer
      });
      message.success(`Pesanan #${order.id} dibuat — total ${rupiah.format(order.total)}`);
      form.resetFields();
      muat();
    } catch (err) {
      message.error(pesanGalat(err, 'Gagal membuat pesanan'));
    } finally {
      setSending(false);
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: 'Pelanggan', dataIndex: 'customer' },
    { title: 'Produk', dataIndex: 'product' },
    { title: 'Qty', dataIndex: 'qty', width: 70, align: 'right' },
    {
      title: 'Harga Satuan',
      dataIndex: 'unit_price',
      width: 150,
      align: 'right',
      render: (v) => rupiah.format(v)
    },
    {
      title: 'Total',
      dataIndex: 'total',
      width: 150,
      align: 'right',
      render: (v) => <b>{rupiah.format(v)}</b>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 120,
      render: (v) => <Tag color={v === 'confirmed' ? 'green' : 'orange'}>{v}</Tag>
    }
  ];

  return (
    <>
      <PageHeader
        title="Pesanan"
        subtitle="Dibuat oleh order-service — divalidasi ke katalog, diumumkan lewat RabbitMQ"
        actions={
          <Button icon={<ReloadOutlined />} onClick={muat}>
            Muat Ulang
          </Button>
        }
      />

      <Card title="Buat Pesanan Baru" style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline" onFinish={buat}>
          <Form.Item
            name="customer"
            rules={[{ required: true, message: 'Nama pelanggan wajib diisi' }]}
          >
            <Input placeholder="Nama pelanggan" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item
            name="product_id"
            rules={[{ required: true, message: 'Pilih produk' }]}
          >
            <Select
              placeholder="Pilih produk"
              style={{ width: 260 }}
              showSearch
              optionFilterProp="label"
              options={products.map((p) => ({
                value: p.id,
                label: `${p.name} — ${rupiah.format(p.price)} (stok ${p.stock})`
              }))}
            />
          </Form.Item>
          <Form.Item name="qty" initialValue={1} rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: 90 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={sending}>
              Buat Pesanan
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Table rowKey="id" columns={columns} dataSource={items} loading={loading} pagination={{ pageSize: 10 }} />
    </>
  );
}
