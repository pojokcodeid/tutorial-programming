import { z } from 'zod';

/* ------------------------------------------------------------------ */
/* Identitas dan peran                                                 */
/* ------------------------------------------------------------------ */

export type Locale = 'id' | 'en';
export type Role = 'customer' | 'admin';

export const userSchema = z.object({
  username: z.string(),
  name: z.string(),
  role: z.enum(['customer', 'admin'])
});

export type User = z.infer<typeof userSchema>;

/* ------------------------------------------------------------------ */
/* Produk, keranjang, dan pesanan                                      */
/* ------------------------------------------------------------------ */

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  price: z.number().nonnegative(),
  emoji: z.string().optional()
});

export type Product = z.infer<typeof productSchema>;

export const cartItemSchema = productSchema.extend({
  qty: z.number().int().positive()
});

export type CartItem = z.infer<typeof cartItemSchema>;

export const orderSchema = z.object({
  id: z.string(),
  items: z.array(cartItemSchema),
  total: z.number().nonnegative(),
  user: userSchema,
  createdAt: z.string()
});

export type Order = z.infer<typeof orderSchema>;

/* ------------------------------------------------------------------ */
/* Event contract                                                      */
/* ------------------------------------------------------------------ */

export const EVENT_ADD_TO_CART = 'tokomicro:add-to-cart';
export const EVENT_CART_UPDATED = 'tokomicro:cart-updated';
export const EVENT_CHECKOUT_COMPLETED = 'tokomicro:checkout-completed';

export const addToCartEventSchema = z.object({
  productId: z.string(),
  name: z.string(),
  price: z.number().nonnegative(),
  qty: z.number().int().positive().default(1),
  at: z.string()
});

export type AddToCartEvent = z.infer<typeof addToCartEventSchema>;

export const cartUpdatedEventSchema = z.object({
  qty: z.number().int().nonnegative(),
  total: z.number().nonnegative()
});

export type CartUpdatedEvent = z.infer<typeof cartUpdatedEventSchema>;

export const checkoutCompletedEventSchema = z.object({
  orderId: z.string(),
  total: z.number().nonnegative()
});

export type CheckoutCompletedEvent = z.infer<typeof checkoutCompletedEventSchema>;

/* ------------------------------------------------------------------ */
/* Manifest remote                                                     */
/* ------------------------------------------------------------------ */

export const remoteNameSchema = z.enum(['header', 'products', 'cart', 'account']);
export type RemoteName = z.infer<typeof remoteNameSchema>;

export const remoteEntrySchema = z.object({
  version: z.string(),
  url: z.string().url(),
  owner: z.string(),
  status: z.enum(['stable', 'canary']),
  releasedAt: z.string()
});

export type RemoteEntry = z.infer<typeof remoteEntrySchema>;

export const remoteManifestSchema = z.object({
  generatedAt: z.string(),
  remotes: z.record(remoteNameSchema, remoteEntrySchema)
});

export type RemoteManifest = z.infer<typeof remoteManifestSchema>;

/* ------------------------------------------------------------------ */
/* Telemetry                                                           */
/* ------------------------------------------------------------------ */

export interface Telemetry {
  event(name: string, payload?: Record<string, unknown>): void;
  error(error: unknown, meta?: Record<string, unknown>): void;
  metric(name: string, value: number, meta?: Record<string, unknown>): void;
}

/* ------------------------------------------------------------------ */
/* Kontrak ctx — satu-satunya permukaan yang dilihat remote            */
/* ------------------------------------------------------------------ */

export type ToastType = 'info' | 'success' | 'error';

export interface AppContext {
  /** Segmen pertama URL, misalnya "katalog" atau "keranjang". */
  route: string;
  /** Query string yang sudah diparse. */
  params: URLSearchParams;
  /** Path lengkap untuk atribut href. */
  href(path: string): string;
  /** Navigasi tanpa memuat ulang halaman. */
  navigate(path: string, options?: { replace?: boolean }): void;
  toast(message: string, type?: ToastType): void;
  user: User | null;
  getToken(): Promise<string | null>;
  login(username: string, password: string): Promise<User>;
  logout(): void;
  locale: Locale;
  setLocale(locale: Locale): void;
  t(key: string, vars?: Record<string, string | number>): string;
  flags: Record<string, boolean>;
  telemetry: Telemetry;
  theme: 'light' | 'dark';
  toggleTheme(): void;
}

export interface RemoteAppProps {
  ctx: AppContext;
}

/** Kontrak minimum yang harus dipenuhi setiap remote. */
export const REMOTE_EXPOSES = './App';
