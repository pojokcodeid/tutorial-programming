import { useEffect, useState } from 'react';
import { App, Button } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import ProductTable from '../components/ProductTable.jsx';
import * as productApi from '../api/productApi.js';

export default function Products() {
  const { message } = App.useApp();          // notifikasi Ant Design (aman untuk tema & locale)
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  async function muat() {
    try {
      setLoading(true);
      setProducts(await productApi.list());
    } catch (err) {
      message.error(err.response?.data?.message || 'Gagal memuat produk');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    muat();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function hapus(produk) {
    try {
      await productApi.remove(produk.id);
      message.success(`"${produk.name}" dihapus`);
      setProducts((lama) => lama.filter((p) => p.id !== produk.id));
    } catch (err) {
      message.error(err.response?.data?.message || 'Gagal menghapus');
      muat();                        // 403 → segarkan daftar agar UI konsisten
    }
  }

  return (
    <>
      <PageHeader
        title="Produk"
        subtitle="CRUD data produk — tulis data butuh token, hapus/ubah butuh admin atau pemilik"
        actions={
          <>
            <Button icon={<ReloadOutlined />} onClick={muat}>
              Muat Ulang
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/products/new')}>
              Produk Baru
            </Button>
          </>
        }
      />
      <ProductTable
        products={products}
        loading={loading}
        onEdit={(p) => navigate(`/products/${p.id}/edit`)}
        onDelete={hapus}
      />
    </>
  );
}
