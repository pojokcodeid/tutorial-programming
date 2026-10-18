import { Card, Statistic, Typography } from 'antd';

/* Kartu statistik — satu komponen dipakai ulang untuk semua angka di dashboard */
export default function StatCard({ title, value, hint, color = '#1677ff' }) {
  return (
    <Card variant="outlined" className="stat-card">
      <Statistic title={title} value={value} styles={{ content: { color } }} />
      {hint && <Typography.Text type="secondary">{hint}</Typography.Text>}
    </Card>
  );
}
