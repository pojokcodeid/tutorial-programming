import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <Result
      status="404"
      title="404"
      subTitle="Halaman yang kamu tuju tidak ada."
      extra={
        <Button type="primary" onClick={() => navigate('/products')}>
          Kembali ke Produk
        </Button>
      }
    />
  );
}
