import { useEffect, useMemo, useState } from 'react';
import { Card, Col, Empty, Row, Table, Tag } from 'antd';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import { formatRupiah } from '../components/ProductTable.jsx';
import * as productApi from '../api/productApi.js';
import { useAuth } from '../auth/AuthContext.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let aktif = true;
    productApi
      .list()
      .then((data) => aktif && setProducts(data))
      .catch(() => aktif && setProducts([]))
      .finally(() => aktif && setLoading(false));
    return () => { aktif = false; };
  }, []);

  const statistik = useMemo(() => {
    const nilai = products.reduce((t, p) => t + p.price * Number(p.stock), 0);
    const stok = products.reduce((t, p) => t + Number(p.stock), 0);
    const kategori = new Set(products.map((p) => p.category)).size;
    return { nilai, stok, kategori };
  }, [products]);

  const stokMenipis = products.filter((p) => p.stock <= 5);

  return (
    <>
      <PageHeader title={`Halo, ${user.name}`} subtitle="Ringkasan toko hari ini" />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Total Produk" value={loading ? '…' : products.length} hint="baris pada /products" color="#1677ff" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Total Stok" value={loading ? '…' : statistik.stok} hint="semua unit" color="#389e0d" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Kategori" value={loading ? '…' : statistik.kategori} hint="jenis kategori" color="#722ed1" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Nilai Persediaan" value={loading ? '…' : formatRupiah(statistik.nilai)} hint="harga × stok" color="#d46b08" />
        </Col>
      </Row>

      <Card title="⚠️ Stok Menipis (≤ 5)" style={{ marginTop: 16 }}>
        {stokMenipis.length === 0 ? (
          <Empty description="Semua stok aman" />
        ) : (
          <Table
            rowKey="id"
            size="medium"
            loading={loading}
            dataSource={stokMenipis}
            pagination={false}
            columns={[
              { title: 'Produk', dataIndex: 'name' },
              { title: 'Kategori', dataIndex: 'category', render: (v) => <Tag>{v}</Tag> },
              { title: 'Stok', dataIndex: 'stock', align: 'right', render: (v) => <Tag color="red">{v}</Tag> }
            ]}
          />
        )}
      </Card>
    </>
  );
}
