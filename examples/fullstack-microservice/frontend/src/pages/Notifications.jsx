import { useEffect, useState } from 'react';
import { App, Button, List, Tag, Empty, Badge } from 'antd';
import { ReloadOutlined, CheckOutlined, BellOutlined } from '@ant-design/icons';
import PageHeader from '../components/PageHeader.jsx';
import * as notificationApi from '../api/notificationApi.js';
import { pesanGalat } from '../api/client.js';

const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

/* Halaman notifikasi — menghubungi notification-service.

   Setiap baris di sini lahir dari rantai: frontend membuat pesanan →
   order-service menerbitkan event order.created ke RabbitMQ →
   notification-service mengonsumsinya dan menyimpan ke MariaDB. */
export default function Notifications() {
  const { message } = App.useApp();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  async function muat() {
    try {
      setLoading(true);
      const { items: data, unread: n } = await notificationApi.list();
      setItems(data);
      setUnread(n);
    } catch (err) {
      message.error(pesanGalat(err, 'Gagal memuat notifikasi'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    muat();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function tandai(n) {
    try {
      await notificationApi.markRead(n.id);
      muat();
    } catch (err) {
      message.error(pesanGalat(err, 'Gagal menandai notifikasi'));
    }
  }

  return (
    <>
      <PageHeader
        title="Notifikasi"
        subtitle={
          <>
            Dari notification-service — <Badge count={unread} showZero /> belum dibaca
          </>
        }
        actions={
          <Button icon={<ReloadOutlined />} onClick={muat} loading={loading}>
            Muat Ulang
          </Button>
        }
      />

      {items.length === 0 ? (
        <Empty description="Belum ada notifikasi — coba buat pesanan di halaman Pesanan" />
      ) : (
        <List
          bordered
          dataSource={items}
          loading={loading}
          renderItem={(n) => (
            <List.Item
              actions={[
                n.is_read ? (
                  <Tag key="r" color="green">
                    dibaca
                  </Tag>
                ) : (
                  <Button key="b" size="small" icon={<CheckOutlined />} onClick={() => tandai(n)}>
                    Tandai dibaca
                  </Button>
                )
              ]}
            >
              <List.Item.Meta
                avatar={<BellOutlined style={{ fontSize: 20, color: n.is_read ? '#bfbfbf' : '#faad14' }} />}
                title={
                  <span>
                    {n.message}{' '}
                    {!n.is_read && <Tag color="orange">baru</Tag>}
                  </span>
                }
                description={`${new Date(n.created_at).toLocaleString('id-ID')} · order #${n.order_id}`}
              />
            </List.Item>
          )}
        />
      )}
    </>
  );
}
