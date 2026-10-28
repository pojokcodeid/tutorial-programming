import type { Locale } from '@tokomicro/contracts';

/**
 * Kamus sederhana. Setiap remote memakai namespace-nya sendiri agar tidak
 * terjadi tabrakan kunci: `header.*`, `products.*`, `cart.*`, `account.*`.
 */
const dictionaries: Record<Locale, Record<string, string>> = {
  id: {
    'nav.catalog': 'Katalog',
    'nav.cart': 'Keranjang',
    'nav.account': 'Akun',
    'nav.login': 'Masuk',
    'nav.logout': 'Keluar',
    'nav.status': 'Status',
    'nav.legacy': 'Katalog lama',
    'common.retry': 'Coba lagi',
    'common.loading': 'Memuat…',
    'common.empty': 'Belum ada data.',
    'header.hello': 'Halo, {name}',
    'products.title': 'Katalog Produk',
    'products.lead':
      'Data diambil dari /api/products oleh remote ini sendiri. Keranjang ditulis lewat modul bersama.',
    'products.add': 'Tambah ke keranjang',
    'products.added': '{name} masuk keranjang',
    'products.error': 'Gagal memuat produk: {message}',
    'products.detail': 'Detail produk',
    'products.back': 'Kembali ke katalog',
    'cart.title': 'Keranjang',
    'cart.lead':
      'Isi keranjang berasal dari @tokomicro/shared — satu instance untuk header, produk, dan remote ini.',
    'cart.empty': 'Keranjang masih kosong.',
    'cart.pick': 'Pilih produk dulu',
    'cart.total': 'Total ({qty} item)',
    'cart.checkout': 'Buat pesanan',
    'cart.sending': 'Mengirim…',
    'cart.loginFirst': 'Silakan masuk untuk membuat pesanan.',
    'cart.success': 'Pesanan {id} berhasil dibuat',
    'cart.failed': 'Gagal membuat pesanan: {message}',
    'cart.orderDone': 'Pesanan {id} diterima',
    'cart.shopAgain': 'Belanja lagi',
    'account.title': 'Akun',
    'account.profile': 'Profil',
    'account.orders': 'Riwayat pesanan',
    'account.loginFirst': 'Masuk untuk melihat profil dan riwayat pesanan.',
    'account.noOrders': 'Belum ada pesanan.',
    'account.role': 'Peran',
    'login.title': 'Masuk ke TokoMicro',
    'login.lead':
      'Login hanya terjadi sekali di shell. Remote lain menerima token lewat ctx.getToken(), bukan lewat halaman login sendiri-sendiri.',
    'login.username': 'Nama pengguna',
    'login.password': 'Kata sandi',
    'login.submit': 'Masuk',
    'login.busy': 'Memeriksa…',
    'login.note':
      'Akun demo: demo / demo123 (customer) atau admin / admin123 (admin). Token akses disimpan di memori; sesi dipulihkan lewat cookie httpOnly.',
    'status.title': 'Status Remote',
    'status.lead':
      'Halaman ini membaca manifest yang sama dengan yang dipakai shell untuk memuat remote.',
    'status.version': 'Versi',
    'status.owner': 'Pemilik',
    'status.state': 'Status',
    'status.released': 'Dirilis',
    'legacy.title': 'Katalog lama',
    'legacy.lead':
      'Halaman ini masih berupa aplikasi lama di origin terpisah. Bab migrasi memindahkannya satu rute demi satu rute.'
  },
  en: {
    'nav.catalog': 'Catalog',
    'nav.cart': 'Cart',
    'nav.account': 'Account',
    'nav.login': 'Sign in',
    'nav.logout': 'Sign out',
    'nav.status': 'Status',
    'nav.legacy': 'Legacy catalog',
    'common.retry': 'Try again',
    'common.loading': 'Loading…',
    'common.empty': 'No data yet.',
    'header.hello': 'Hello, {name}',
    'products.title': 'Product Catalog',
    'products.lead':
      'This remote fetches /api/products itself. The cart is written through the shared module.',
    'products.add': 'Add to cart',
    'products.added': '{name} added to cart',
    'products.error': 'Failed to load products: {message}',
    'products.detail': 'Product detail',
    'products.back': 'Back to catalog',
    'cart.title': 'Cart',
    'cart.lead':
      'Cart items come from @tokomicro/shared — one instance for header, products, and this remote.',
    'cart.empty': 'Your cart is empty.',
    'cart.pick': 'Pick a product first',
    'cart.total': 'Total ({qty} items)',
    'cart.checkout': 'Place order',
    'cart.sending': 'Sending…',
    'cart.loginFirst': 'Please sign in to place an order.',
    'cart.success': 'Order {id} created',
    'cart.failed': 'Failed to create order: {message}',
    'cart.orderDone': 'Order {id} received',
    'cart.shopAgain': 'Shop again',
    'account.title': 'Account',
    'account.profile': 'Profile',
    'account.orders': 'Order history',
    'account.loginFirst': 'Sign in to see your profile and order history.',
    'account.noOrders': 'No orders yet.',
    'account.role': 'Role',
    'login.title': 'Sign in to TokoMicro',
    'login.lead':
      'Sign-in happens once in the shell. Other remotes receive a token through ctx.getToken(), not their own login page.',
    'login.username': 'Username',
    'login.password': 'Password',
    'login.submit': 'Sign in',
    'login.busy': 'Checking…',
    'login.note':
      'Demo accounts: demo / demo123 (customer) or admin / admin123 (admin). The access token lives in memory; the session is restored via an httpOnly cookie.',
    'status.title': 'Remote Status',
    'status.lead': 'This page reads the same manifest the shell uses to load remotes.',
    'status.version': 'Version',
    'status.owner': 'Owner',
    'status.state': 'Status',
    'status.released': 'Released',
    'legacy.title': 'Legacy catalog',
    'legacy.lead':
      'This page is still a legacy app on a separate origin. The migration chapter moves it one route at a time.'
  }
};

export function createTranslator(locale: Locale) {
  const dictionary = dictionaries[locale] ?? dictionaries.id;

  return function t(key: string, vars?: Record<string, string | number>): string {
    const template = dictionary[key] ?? dictionaries.id[key] ?? key;
    if (!vars) return template;
    return template.replace(/\{(\w+)\}/g, (_, name: string) =>
      name in vars ? String(vars[name]) : `{${name}}`
    );
  };
}

export function detectLocale(): Locale {
  if (typeof navigator === 'undefined') return 'id';
  return navigator.language.toLowerCase().startsWith('en') ? 'en' : 'id';
}
