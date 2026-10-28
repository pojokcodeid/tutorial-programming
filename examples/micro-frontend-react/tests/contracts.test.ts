import { describe, expect, it } from 'vitest';
import {
  addToCartEventSchema,
  orderSchema,
  productSchema,
  remoteManifestSchema
} from '@tokomicro/contracts';

describe('kontrak produk', () => {
  it('menerima produk yang valid', () => {
    const result = productSchema.safeParse({
      id: 'kb-01',
      name: 'Keyboard Mekanik',
      category: 'Periferal',
      price: 850_000,
      emoji: '⌨️'
    });
    expect(result.success).toBe(true);
  });

  it('menolak harga negatif', () => {
    const result = productSchema.safeParse({
      id: 'x',
      name: 'X',
      category: 'X',
      price: -1
    });
    expect(result.success).toBe(false);
  });
});

describe('kontrak event', () => {
  it('memberi qty bawaan 1', () => {
    const result = addToCartEventSchema.parse({
      productId: 'kb-01',
      name: 'Keyboard',
      price: 1000,
      at: new Date().toISOString()
    });
    expect(result.qty).toBe(1);
  });

  it('menolak qty pecahan', () => {
    const result = addToCartEventSchema.safeParse({
      productId: 'kb-01',
      name: 'Keyboard',
      price: 1000,
      qty: 1.5,
      at: new Date().toISOString()
    });
    expect(result.success).toBe(false);
  });
});

describe('kontrak manifest', () => {
  it('menerima empat remote lengkap', () => {
    const result = remoteManifestSchema.safeParse({
      generatedAt: new Date().toISOString(),
      remotes: {
        header: {
          version: '1.0.0',
          url: 'http://localhost:4174/assets/remoteEntry.js',
          owner: 'Tim Chrome',
          status: 'stable',
          releasedAt: new Date().toISOString()
        },
        products: {
          version: '1.0.0',
          url: 'http://localhost:4175/assets/remoteEntry.js',
          owner: 'Tim Katalog',
          status: 'stable',
          releasedAt: new Date().toISOString()
        },
        cart: {
          version: '1.0.0',
          url: 'http://localhost:4176/assets/remoteEntry.js',
          owner: 'Tim Transaksi',
          status: 'stable',
          releasedAt: new Date().toISOString()
        },
        account: {
          version: '1.0.0',
          url: 'http://localhost:4177/assets/remoteEntry.js',
          owner: 'Tim Akun',
          status: 'stable',
          releasedAt: new Date().toISOString()
        }
      }
    });
    expect(result.success).toBe(true);
  });

  it('menolak status rilis yang tidak dikenal', () => {
    const result = remoteManifestSchema.safeParse({
      generatedAt: new Date().toISOString(),
      remotes: {
        header: {
          version: '1.0.0',
          url: 'http://localhost:4174/assets/remoteEntry.js',
          owner: 'Tim Chrome',
          status: 'beta',
          releasedAt: new Date().toISOString()
        }
      }
    });
    expect(result.success).toBe(false);
  });
});

describe('kontrak pesanan', () => {
  it('menerima pesanan lengkap', () => {
    const result = orderSchema.safeParse({
      id: 'ORD-1',
      items: [
        {
          id: 'kb-01',
          name: 'Keyboard',
          category: 'Periferal',
          price: 850_000,
          qty: 2
        }
      ],
      total: 1_700_000,
      user: { username: 'demo', name: 'Dewi', role: 'customer' },
      createdAt: new Date().toISOString()
    });
    expect(result.success).toBe(true);
  });
});
