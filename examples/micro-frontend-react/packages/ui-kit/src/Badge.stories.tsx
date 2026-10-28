import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta = {
  title: 'Komponen/Badge',
  component: Badge,
  tags: ['autodocs'],
  args: { children: '3', tone: 'solid' }
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Solid: Story = {};
export const Default: Story = { args: { tone: 'default', children: 'Default' } };
export const Success: Story = { args: { tone: 'success', children: 'Stabil' } };
export const Danger: Story = { args: { tone: 'danger', children: 'Gagal' } };
