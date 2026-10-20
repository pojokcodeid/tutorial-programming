import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, App } from 'antd';
import { AppstoreOutlined, ShoppingCartOutlined, BellOutlined } from '@ant-design/icons';
import PageHeader from '../components/PageHeader.jsx';
import * as productApi from '../api/productApi.js';
import * as orderApi from '../api/orderApi.js';
import * as notificationApi from '../api/notificationApi.js';
import { pesanGalat } from '../api/client.js';

const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

/* Dashboard membaca dari TIGA service sekaligus — menunjukkan bagaimana
   frontend menyatukan microservices yang masing-masing punya database sendiri. */
export default function Dashboard() {
  const { message } = App.useApp();
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0, unread: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let hidup = true;
    (async () => {
      try {
        const [products, orders, notif] = await Promise.all([
          productApi.list(),
          orderApi.list(),
          notificationApi.list()
        ]);
        if (!hidup) return;
        setStats({
          products: products.length,
          orders: orders.length,
          revenue: orders.reduce((sum, o) => sum + o.total, 0),
          unread: notif.unread
        });
      } catch (err) {
        message.error(pesanGalat(err, 'Gagal memuat dashboard'));
      } finally {
        if (hidup) setLoading(false);
      }
    })();
    return () => {
      hidup = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Ringkasan dari product-, order-, dan notification-service" />
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic title="Produk" value={stats.products} prefix={<AppstoreOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic title="Pesanan" value={stats.orders} prefix={<ShoppingCartOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic title="Pendapatan" value={stats.revenue} prefix="Rp" precision={0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic title="Notifikasi Baru" value={stats.unread} prefix={<BellOutlined />} />
          </Card>
        </Col>
      </Row>
      <Card style={{ marginTop: 16 }} title="Total pendapatan (format rapi)">
        <Statistic value={stats.revenue} prefix="Rp" precision={0} valueStyle={{ fontSize: 28 }} />
        <p style={{ marginTop: 8, color: '#888' }}>
          Angka ini dihitung di browser dari data order-service — pada proyek nyata, hitung agregat
          seperti ini sebaiknya dilakukan di backend (atau materialisasi CQRS).
        </p>
      </Card>
    </>
  );
}
