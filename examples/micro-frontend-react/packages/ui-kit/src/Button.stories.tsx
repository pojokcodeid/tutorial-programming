import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta = {
  title: 'Komponen/Button',
  component: Button,
  tags: ['autodocs'],
  args: { children: 'Tambah ke keranjang', variant: 'primary' }
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: 'secondary', children: 'Batal' } };
export const Ghost: Story = { args: { variant: 'ghost', children: 'Lewati' } };
export const Danger: Story = { args: { variant: 'danger', children: 'Hapus' } };
export const Loading: Story = { args: { loading: true } };
export const Small: Story = { args: { size: 'sm', children: 'Kecil' } };
