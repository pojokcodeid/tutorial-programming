import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Badge, Button, Card } from '@tokomicro/ui-kit';

describe('Button', () => {
  it('merender label dan memanggil onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Tambah</Button>);

    await userEvent.click(screen.getByRole('button', { name: 'Tambah' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('menonaktifkan tombol saat loading', () => {
    render(<Button loading>Kirim</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('memakai kelas varian primary', () => {
    render(<Button variant="primary">Beli</Button>);
    expect(screen.getByRole('button')).toHaveClass('tm-btn--primary');
  });
});

describe('Card dan Badge', () => {
  it('merender judul, isi, dan footer', () => {
    render(
      <Card title="Keyboard" footer={<span>Rp850.000</span>}>
        Switch taktil
      </Card>
    );

    expect(screen.getByRole('heading', { name: 'Keyboard' })).toBeInTheDocument();
    expect(screen.getByText('Switch taktil')).toBeInTheDocument();
    expect(screen.getByText('Rp850.000')).toBeInTheDocument();
  });

  it('memberi label aksesibel pada badge', () => {
    render(
      <Badge tone="solid" label="3 item di keranjang">
        3
      </Badge>
    );
    expect(screen.getByLabelText('3 item di keranjang')).toHaveTextContent('3');
  });
});
