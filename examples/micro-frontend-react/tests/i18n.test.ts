import { describe, expect, it } from 'vitest';
import { createTranslator } from '@tokomicro/i18n';

describe('i18n', () => {
  it('mengembalikan teks Indonesia', () => {
    const t = createTranslator('id');
    expect(t('products.add')).toBe('Tambah ke keranjang');
  });

  it('mengganti variabel di dalam template', () => {
    const t = createTranslator('id');
    expect(t('products.added', { name: 'Keyboard' })).toBe('Keyboard masuk keranjang');
  });

  it('memakai kamus Inggris saat locale en', () => {
    const t = createTranslator('en');
    expect(t('nav.catalog')).toBe('Catalog');
  });

  it('jatuh ke kamus Indonesia lalu ke kunci asli', () => {
    const t = createTranslator('id');
    expect(t('tidak.ada')).toBe('tidak.ada');
  });
});
