import { Space, Typography } from 'antd';

/* Judul halaman yang konsisten di semua halaman */
export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {title}
        </Typography.Title>
        {subtitle && <Typography.Text type="secondary">{subtitle}</Typography.Text>}
      </div>
      <Space wrap>{actions}</Space>
    </div>
  );
}
