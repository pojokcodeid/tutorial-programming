import { createRoot } from 'react-dom/client';
import { Badge, Button, Card, useTheme } from './index';
import './tokens.css';

function Gallery() {
  const { theme, toggleTheme } = useTheme();

  return (
    <main style={{ maxWidth: 880, margin: '0 auto', padding: 32 }}>
      <div className="tm-row" style={{ justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0 }}>Design System TokoMicro</h1>
          <p className="tm-muted">
            Token, komponen, dan tema yang dipakai shell serta seluruh remote.
          </p>
        </div>
        <Button onClick={toggleTheme} variant="secondary">
          Tema: {theme === 'light' ? 'terang' : 'gelap'}
        </Button>
      </div>

      <div className="tm-stack" style={{ marginTop: 28 }}>
        <Card title="Tombol">
          <div className="tm-row">
            <Button variant="primary">Primary</Button>
            <Button>Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="primary" loading>
              Memuat
            </Button>
          </div>
        </Card>

        <Card
          title="Badge"
          footer={<span className="tm-muted">Badge dipakai header untuk jumlah keranjang.</span>}
        >
          <div className="tm-row">
            <Badge>Default</Badge>
            <Badge tone="solid">3</Badge>
            <Badge tone="success">Stabil</Badge>
            <Badge tone="danger">Gagal</Badge>
          </div>
        </Card>

        <Card title="Token warna">
          <div className="tm-row">
            {['bg', 'card', 'text', 'accent', 'green', 'red'].map((name) => (
              <div key={name} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: 72,
                    height: 48,
                    borderRadius: 10,
                    border: '1px solid var(--tm-border)',
                    background: `var(--tm-${name})`
                  }}
                />
                <span className="tm-muted">--tm-{name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </main>
  );
}

createRoot(document.getElementById('gallery')!).render(<Gallery />);
