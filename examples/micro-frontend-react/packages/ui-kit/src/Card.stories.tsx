import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';

const meta = {
  title: 'Komponen/Card',
  component: Card,
  tags: ['autodocs'],
  args: {
    title: 'Keyboard Mekanik',
    children: 'Keyboard dengan switch taktil dan lampu latar.',
    footer: <Button variant="primary">Tambah ke keranjang</Button>
  }
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithBadge: Story = {
  args: {
    title: (
      <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        Keyboard Mekanik <Badge tone="success">Baru</Badge>
      </span>
    )
  }
};
