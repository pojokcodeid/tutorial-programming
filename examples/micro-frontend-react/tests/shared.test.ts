import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addItem,
  cartSummary,
  changeQty,
  clearCart,
  getSnapshot,
  onAddToCart,
  emitAddToCart,
  removeItem,
  rupiah
} from '@tokomicro/shared';

const keyboard = {
  id: 'kb-01',
  name: 'Keyboard Mekanik',
  category: 'Periferal',
  price: 850_000,
  emoji: '⌨️'
};

const mouse = {
  id: 'ms-02',
  name: 'Mouse Nirkabel',
  category: 'Periferal',
  price: 320_000,
  emoji: '🖱️'
};

beforeEach(() => {
  clearCart();
});

describe('state keranjang bersama', () => {
  it('menambah produk baru dengan qty 1', () => {
    addItem(keyboard);
    expect(getSnapshot()).toHaveLength(1);
    expect(getSnapshot()[0]).toMatchObject({ id: 'kb-01', qty: 1 });
  });

  it('menambah produk yang sama menaikkan qty, bukan menduplikasi baris', () => {
    addItem(keyboard);
    addItem(keyboard);
    expect(getSnapshot()).toHaveLength(1);
    expect(getSnapshot()[0].qty).toBe(2);
  });

  it('mengubah qty dan menghapus item', () => {
    addItem(keyboard);
    changeQty('kb-01', 1);
    expect(getSnapshot()[0].qty).toBe(2);

    changeQty('kb-01', -1);
    expect(getSnapshot()[0].qty).toBe(1);

    removeItem('kb-01');
    expect(getSnapshot()).toHaveLength(0);
  });

  it('qty nol menghapus item secara otomatis', () => {
    addItem(keyboard);
    changeQty('kb-01', -1);
    expect(getSnapshot()).toHaveLength(0);
  });

  it('menghitung total dan jumlah item', () => {
    addItem(keyboard);
    addItem(keyboard);
    addItem(mouse);
    expect(cartSummary()).toEqual({ qty: 3, total: 850_000 * 2 + 320_000 });
  });

  it('memformat rupiah ala Indonesia', () => {
    expect(rupiah(1_250_000)).toBe('Rp1.250.000');
  });
});

describe('event bus', () => {
  it('mengirim dan menerima add-to-cart yang valid', () => {
    const handler = vi.fn();
    const stop = onAddToCart(handler);

    emitAddToCart({
      productId: 'kb-01',
      name: 'Keyboard Mekanik',
      price: 850_000,
      qty: 1,
      at: new Date().toISOString()
    });

    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0].productId).toBe('kb-01');
    stop();
  });

  it('mengabaikan payload yang tidak sesuai kontrak', () => {
    const handler = vi.fn();
    const stop = onAddToCart(handler);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    window.dispatchEvent(
      new CustomEvent('tokomicro:add-to-cart', { detail: { productId: 123 } })
    );

    expect(handler).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
    stop();
  });
});
